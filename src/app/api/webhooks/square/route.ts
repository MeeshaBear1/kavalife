import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markOrderPaid, closeOrder } from "@/lib/orders";
import {
  isSquareConfigured,
  squareWebhookSignatureKey,
  verifyWebhookSignature,
  webhookNotificationUrl,
} from "@/lib/square";

export const runtime = "nodejs";

type SquareEvent = {
  type?: string;
  data?: {
    object?: {
      payment?: {
        id: string;
        status?: string;
        order_id?: string;
      };
      refund?: {
        id: string;
        status?: string;
        payment_id?: string;
        order_id?: string;
        amount_money?: { amount?: number; currency?: string };
      };
    };
  };
};

export async function POST(req: Request) {
  const signatureKey = squareWebhookSignatureKey;
  if (!isSquareConfigured || !signatureKey) {
    return NextResponse.json({ error: "Square is not configured." }, { status: 503 });
  }

  // The raw, unparsed body is required for signature verification.
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const valid = verifyWebhookSignature({
    rawBody,
    signature,
    notificationUrl: webhookNotificationUrl(),
    signatureKey,
  });
  if (!valid) {
    console.error("Square webhook signature verification failed.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: SquareEvent;
  try {
    event = JSON.parse(rawBody) as SquareEvent;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    switch (event.type) {
      // A payment was created or updated. When it settles (COMPLETED), fulfill
      // the matching order: mark paid + decrement stock (idempotent).
      case "payment.created":
      case "payment.updated": {
        await handlePayment(event);
        break;
      }

      // A refund settled: on a FULL refund mark the order REFUNDED and return
      // its items to inventory. Partial refunds are left alone.
      case "refund.created":
      case "refund.updated": {
        await handleRefund(event);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // A 500 makes Square retry — safe because every handler is idempotent.
    console.error(`Error handling Square webhook ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePayment(event: SquareEvent) {
  const payment = event.data?.object?.payment;
  if (!payment?.order_id) return;
  // Only act on a settled payment; APPROVED/PENDING confirm later via updates.
  if (payment.status !== "COMPLETED") return;

  const order = await prisma.order.findUnique({
    where: { paymentSessionId: payment.order_id },
  });
  if (!order) {
    console.warn("Square webhook: no order for Square order", payment.order_id);
    return;
  }
  await markOrderPaid(order.id, { paymentRef: payment.id });
}

async function handleRefund(event: SquareEvent) {
  const refund = event.data?.object?.refund;
  if (!refund) return;
  // Square refunds settle asynchronously; only act once COMPLETED.
  if (refund.status !== "COMPLETED") return;

  // Match by the Square payment id first, then fall back to the Square order id.
  const order =
    (refund.payment_id
      ? await prisma.order.findFirst({ where: { paymentRef: refund.payment_id } })
      : null) ??
    (refund.order_id
      ? await prisma.order.findUnique({ where: { paymentSessionId: refund.order_id } })
      : null);

  if (!order) {
    console.warn("Square webhook: no order for refunded payment", refund.payment_id);
    return;
  }

  // Only a full refund flips the order to REFUNDED + restocks; partials are left.
  const refundedCents = refund.amount_money?.amount ?? 0;
  if (refundedCents < order.totalCents) {
    console.log(
      `Partial refund on order ${order.orderNumber} (${refundedCents}/${order.totalCents}) — left unchanged.`
    );
    return;
  }
  await closeOrder(order.id, "REFUNDED");
}
