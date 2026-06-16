import "server-only";
import { prisma } from "./db";
import { createPaymentLink, isSquareConfigured, type PaymentLinkLine } from "./square";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Create (idempotently) a Square hosted payment link for an existing PENDING
 * order, persist the Square order id + link url on it, and return the url.
 *
 * This is the single source of truth for "process this order's payment through
 * Square", used by BOTH storefront checkout (real-Square mode) and the admin
 * "Collect payment" action — so a live order placed in reserve mode can always
 * be charged through Square later from the dashboard, building the exact same
 * line items either way.
 *
 * Re-calling for the same order reuses the original Square link (same
 * idempotency key), so "Regenerate" never creates duplicate Square orders.
 */
export async function createOrderPaymentLink(
  orderId: string
): Promise<{ url: string; squareOrderId: string }> {
  if (!isSquareConfigured) {
    throw new Error(
      "Square is not configured. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID to charge through Square."
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found.");
  if (order.status !== "PENDING") {
    throw new Error("Only a pending order can be charged.");
  }
  // The simple payment-link API charges the sum of its line items, and our
  // checkout never applies order-level discounts — so line items == order total.
  // Guard so we can never silently overcharge if a discounted order ever reaches
  // this path (would need Square order-level discounts to handle correctly).
  if (order.discountCents > 0) {
    throw new Error("Discounted orders can't be charged via a Square payment link yet.");
  }

  // Shipping and tax are sent as their own line items so the charged total
  // always equals the order total.
  const lines: PaymentLinkLine[] = order.items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unitAmountCents: i.unitPriceCents,
  }));
  if (order.shippingCents > 0) {
    lines.push({ name: "Shipping", quantity: 1, unitAmountCents: order.shippingCents });
  }
  if (order.taxCents > 0) {
    lines.push({ name: "Tax", quantity: 1, unitAmountCents: order.taxCents });
  }

  const link = await createPaymentLink({
    // One payment link per order; a retried/regenerated request reuses it.
    idempotencyKey: `paylink_${order.id}`,
    referenceId: order.id,
    currency: order.currency,
    buyerEmail: order.email,
    // Square appends orderId/referenceId/transactionId to this URL on return.
    redirectUrl: `${siteUrl()}/checkout/success?order=${order.orderNumber}`,
    lines,
  });

  // Store the Square order id (so the webhook can match the payment back to us)
  // and the link url (so the seller can re-send it from the admin).
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentSessionId: link.squareOrderId, paymentLinkUrl: link.url },
  });

  return { url: link.url, squareOrderId: link.squareOrderId };
}
