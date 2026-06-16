import "server-only";
import crypto from "crypto";

/**
 * Square integration via the REST API (no SDK — avoids major-version drift and
 * keeps the dependency surface small). We use Square-hosted Payment Links, the
 * clean analog to Stripe Checkout's redirect flow:
 *
 *   create PENDING order  ->  create payment link  ->  redirect buyer to Square
 *   ->  payment.updated webhook (or success-page fallback)  ->  markOrderPaid
 *
 * Configure with SQUARE_ACCESS_TOKEN + SQUARE_LOCATION_ID. Webhooks additionally
 * need SQUARE_WEBHOOK_SIGNATURE_KEY. Set SQUARE_ENV=sandbox for test credentials.
 */

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;

export const isSquareConfigured = Boolean(accessToken && locationId);

// Square API version. Bump to the current version shown in your Square
// developer dashboard if the API rejects this one.
const API_VERSION = process.env.SQUARE_API_VERSION || "2025-01-23";

function apiBase(): string {
  return process.env.SQUARE_ENV === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Square-Version": API_VERSION,
    "Content-Type": "application/json",
  };
}

export interface SquareLineItem {
  name: string;
  quantity: number;
  /** Unit price in the smallest currency unit (cents). */
  amountCents: number;
}

/**
 * Create a Square-hosted payment link for an order. `referenceId` is our
 * internal order id (echoed back on the Square order so we can reconcile).
 */
export async function createSquarePaymentLink(opts: {
  idempotencyKey: string;
  referenceId: string;
  currency: string;
  buyerEmail?: string;
  lineItems: SquareLineItem[];
  redirectUrl: string;
  note?: string;
}): Promise<{ url: string; squareOrderId: string; paymentLinkId: string }> {
  if (!isSquareConfigured) throw new Error("Square is not configured.");

  const currency = opts.currency.toUpperCase();
  const body = {
    // Square caps idempotency keys at 45 chars; cuid order ids are well under.
    idempotency_key: opts.idempotencyKey.slice(0, 45),
    order: {
      location_id: locationId,
      reference_id: opts.referenceId,
      line_items: opts.lineItems.map((l) => ({
        name: l.name,
        quantity: String(l.quantity),
        base_price_money: { amount: l.amountCents, currency },
      })),
    },
    checkout_options: {
      redirect_url: opts.redirectUrl,
      ask_for_shipping_address: false,
    },
    ...(opts.buyerEmail ? { pre_populated_data: { buyer_email: opts.buyerEmail } } : {}),
    ...(opts.note ? { payment_note: opts.note } : {}),
  };

  const res = await fetch(`${apiBase()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    payment_link?: { id?: string; order_id?: string; url?: string; long_url?: string };
    errors?: { detail?: string; code?: string }[];
  };

  if (!res.ok || !json.payment_link) {
    const detail =
      json.errors?.map((e) => e.detail || e.code).filter(Boolean).join("; ") ||
      `Square returned ${res.status}`;
    throw new Error(`Square payment link failed: ${detail}`);
  }

  const link = json.payment_link;
  const url = link.url || link.long_url;
  if (!url || !link.order_id) {
    throw new Error("Square payment link response missing url/order_id.");
  }
  return { url, squareOrderId: link.order_id, paymentLinkId: link.id || "" };
}

/**
 * Verify a Square webhook signature. Square signs HMAC-SHA256 over
 * (notificationUrl + rawBody) with the webhook signature key, base64-encoded,
 * delivered in the `x-square-hmacsha256-signature` header.
 */
export function verifySquareWebhookSignature(
  rawBody: string,
  signature: string | null,
  notificationUrl: string
): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !signature) return false;

  const expected = crypto
    .createHmac("sha256", key)
    .update(notificationUrl + rawBody)
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Retrieve a Square order (used by the success-page reconciliation fallback). */
export async function retrieveSquareOrder(
  squareOrderId: string
): Promise<{ state?: string; netAmountDueCents?: number } | null> {
  if (!isSquareConfigured) return null;
  try {
    const res = await fetch(`${apiBase()}/v2/orders/${encodeURIComponent(squareOrderId)}`, {
      method: "GET",
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      order?: { state?: string; net_amount_due_money?: { amount?: number } };
    };
    if (!json.order) return null;
    return {
      state: json.order.state,
      netAmountDueCents: json.order.net_amount_due_money?.amount,
    };
  } catch {
    return null;
  }
}
