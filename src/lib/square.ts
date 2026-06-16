import "server-only";
import crypto from "node:crypto";

/**
 * Square integration via the stable REST API (no SDK — this avoids the churn in
 * the v40+ Square TypeScript SDK rewrite). We only need three endpoints: create
 * a hosted payment link, look up an order, and look up a payment. Webhook
 * signatures are verified manually with Square's documented HMAC-SHA256 scheme.
 *
 * MOCK MODE: when SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID is unset, the store
 * runs in mock checkout mode (orders are created and marked paid with no real
 * charge), so the whole flow is demoable locally with zero credentials.
 */

const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
const locationId = process.env.SQUARE_LOCATION_ID?.trim();
const environment = (process.env.SQUARE_ENVIRONMENT?.trim() || "sandbox").toLowerCase();

export const isSquareConfigured = Boolean(accessToken && locationId);
export const squareLocationId = locationId;

// Pin the Square API version so behaviour can't drift under us on a dashboard
// upgrade. Override with SQUARE_API_VERSION if Square ever rejects this one.
const SQUARE_VERSION = process.env.SQUARE_API_VERSION?.trim() || "2025-01-23";

const API_BASE =
  environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

type SquareMoney = { amount: number; currency: string };

async function squareFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!accessToken) {
    throw new Error("Square is not configured (missing SQUARE_ACCESS_TOKEN).");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Square-Version": SQUARE_VERSION,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail =
      json?.errors?.[0]?.detail || json?.errors?.[0]?.code || res.statusText;
    throw new Error(`Square API ${res.status}: ${detail}`);
  }
  return json as T;
}

export type PaymentLinkLine = {
  name: string;
  quantity: number;
  unitAmountCents: number;
};

export type CreatedPaymentLink = {
  url: string;
  squareOrderId: string;
  paymentLinkId: string;
};

/**
 * Create a hosted Square payment link for an order. The buyer is redirected to
 * `url`; after paying, Square redirects them to `redirectUrl` (appending its own
 * `orderId`/`referenceId`/`transactionId` query params for reconciliation).
 */
export async function createPaymentLink(input: {
  idempotencyKey: string;
  referenceId: string; // our internal order id (Square caps reference_id at 40 chars)
  currency: string; // e.g. "usd"
  buyerEmail?: string;
  redirectUrl: string;
  lines: PaymentLinkLine[];
}): Promise<CreatedPaymentLink> {
  const currency = input.currency.toUpperCase();
  const body = {
    idempotency_key: input.idempotencyKey,
    order: {
      location_id: locationId,
      reference_id: input.referenceId.slice(0, 40),
      line_items: input.lines.map((l) => ({
        name: l.name,
        quantity: String(l.quantity),
        base_price_money: { amount: l.unitAmountCents, currency } as SquareMoney,
      })),
    },
    checkout_options: {
      redirect_url: input.redirectUrl,
      ask_for_shipping_address: false,
    },
    ...(input.buyerEmail
      ? { pre_populated_data: { buyer_email: input.buyerEmail } }
      : {}),
  };

  const json = await squareFetch<{
    payment_link?: { id: string; url: string; order_id: string };
  }>("/v2/online-checkout/payment-links", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const link = json.payment_link;
  if (!link?.url || !link?.order_id) {
    throw new Error("Square did not return a usable payment link.");
  }
  return { url: link.url, squareOrderId: link.order_id, paymentLinkId: link.id };
}

export type SquarePayment = {
  id: string;
  status: string; // APPROVED | COMPLETED | CANCELED | FAILED
  orderId?: string;
};

/** Look up a Square payment by id (used for success-page reconciliation). */
export async function getPayment(paymentId: string): Promise<SquarePayment | null> {
  try {
    const json = await squareFetch<{
      payment?: { id: string; status: string; order_id?: string };
    }>(`/v2/payments/${encodeURIComponent(paymentId)}`);
    if (!json.payment) return null;
    return {
      id: json.payment.id,
      status: json.payment.status,
      orderId: json.payment.order_id,
    };
  } catch {
    return null;
  }
}

export type SquareOrder = {
  id: string;
  state: string; // OPEN | COMPLETED | CANCELED
  totalCents: number;
  paid: boolean;
};

/** Look up a Square order by id. `paid` is true once the order is settled. */
export async function getOrder(orderId: string): Promise<SquareOrder | null> {
  try {
    const json = await squareFetch<{
      order?: {
        id: string;
        state: string;
        total_money?: SquareMoney;
        net_amount_due_money?: SquareMoney;
        tenders?: unknown[];
      };
    }>(`/v2/orders/${encodeURIComponent(orderId)}`);
    const o = json.order;
    if (!o) return null;
    const due = o.net_amount_due_money?.amount;
    const paid =
      o.state === "COMPLETED" ||
      due === 0 ||
      (Array.isArray(o.tenders) && o.tenders.length > 0);
    return { id: o.id, state: o.state, totalCents: o.total_money?.amount ?? 0, paid };
  } catch {
    return null;
  }
}

/**
 * Verify a Square webhook signature. Square computes
 *   base64( HMAC_SHA256( signatureKey, notificationUrl + rawBody ) )
 * and sends it in the `x-square-hmacsha256-signature` header. The notification
 * URL must be the exact URL configured in the Square dashboard.
 */
export function verifyWebhookSignature(args: {
  rawBody: string;
  signature: string | null;
  notificationUrl: string;
  signatureKey: string;
}): boolean {
  if (!args.signature) return false;
  const hmac = crypto.createHmac("sha256", args.signatureKey);
  hmac.update(args.notificationUrl + args.rawBody);
  const expected = hmac.digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(args.signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const squareWebhookSignatureKey =
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();

/** The exact URL Square posts webhooks to (must match the dashboard config). */
export function webhookNotificationUrl(): string {
  const explicit = process.env.SQUARE_WEBHOOK_URL?.trim();
  if (explicit) return explicit;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/api/webhooks/square`;
}
