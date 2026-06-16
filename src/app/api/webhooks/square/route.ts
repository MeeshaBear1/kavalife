import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { isSquareConfigured, verifySquareWebhookSignature } from "@/lib/square";

export const runtime = "nodejs";

/** The exact URL this route is reachable at — must match the Square subscription. */
function notificationUrl(): string {
  const explicit = process.env.SQUARE_WEBHOOK_URL;
  if (explicit) return explicit;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/webhooks/square`;
}

export async function POST(req: Request) {
  if (!isSquareConfigured || !process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    return NextResponse.json({ error: "Square is not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  if (!verifySquareWebhookSignature(rawBody, signature, notificationUrl())) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    type?: string;
    data?: { object?: { payment?: { id?: string; order_id?: string; status?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    if (event.type === "payment.created" || event.type === "payment.updated") {
      const payment = event.data?.object?.payment;
      // Square payments settle as COMPLETED; ignore APPROVED/PENDING/FAILED here.
      if (payment?.status === "COMPLETED" && payment.order_id) {
        const order = await prisma.order.findUnique({
          where: { squareOrderId: payment.order_id },
        });
        if (order) {
          await markOrderPaid(order.id, { squarePaymentId: payment.id });
        } else {
          console.warn("Square webhook: no order for square order", payment.order_id);
        }
      }
    }
  } catch (err) {
    console.error(`Error handling Square webhook ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
