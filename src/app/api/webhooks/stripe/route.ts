import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await fulfillSession(session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillSession(session);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function fulfillSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id || undefined;
  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId } })
    : await prisma.order.findUnique({ where: { stripeSessionId: session.id } });
  if (!order) {
    console.warn("Webhook: no order found for session", session.id);
    return;
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  await markOrderPaid(order.id, { paymentIntentId });
}
