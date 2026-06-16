import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { createSquarePaymentLink } from "@/lib/square";
import { activeProcessor, mockCheckoutBlocked } from "@/lib/payments";
import { getSettings, computeShippingCents, computeTaxCents } from "@/lib/settings";
import { markOrderPaid } from "@/lib/orders";
import { generateOrderNumber } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Your cart is empty."),
  email: z.string().email("A valid email is required."),
  customerName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  shippingAddress: z
    .object({
      line1: z.string().trim().min(1),
      line2: z.string().trim().optional().nullable(),
      city: z.string().trim().min(1),
      state: z.string().trim().min(1),
      postalCode: z.string().trim().min(1),
      country: z.string().trim().min(2).max(2).default("US"),
    })
    .optional(),
});

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid checkout request." },
      { status: 400 }
    );
  }
  const { items, email, customerName, phone, shippingAddress } = parsed.data;

  // Load products from the DB — never trust client-supplied prices.
  const ids = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: {
    product: (typeof products)[number];
    quantity: number;
    lineTotalCents: number;
  }[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "One of your items is no longer available. Please refresh your cart." },
        { status: 409 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Only ${product.stock} of ${product.name} left in stock.` },
        { status: 409 }
      );
    }
    lines.push({
      product,
      quantity: item.quantity,
      lineTotalCents: product.priceCents * item.quantity,
    });
  }

  const settings = await getSettings();
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const shippingCents = computeShippingCents(subtotalCents, settings);
  const taxCents = computeTaxCents(subtotalCents, settings.taxRateBps);
  const totalCents = subtotalCents + shippingCents + taxCents;

  // Create the PENDING order with line snapshots.
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      status: "PENDING",
      email: email.toLowerCase(),
      customerName: customerName ?? null,
      phone: phone ?? null,
      shippingAddress: shippingAddress
        ? (shippingAddress as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      currency: settings.currency,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          flavor: l.product.flavor,
          unitPriceCents: l.product.priceCents,
          quantity: l.quantity,
          lineTotalCents: l.lineTotalCents,
        })),
      },
    },
  });

  // Generic checkout lines (products + shipping + tax), mapped per processor.
  const checkoutLines = [
    ...lines.map((l) => ({
      name: l.product.name,
      amountCents: l.product.priceCents,
      quantity: l.quantity,
    })),
    ...(shippingCents > 0 ? [{ name: "Shipping", amountCents: shippingCents, quantity: 1 }] : []),
    ...(taxCents > 0 ? [{ name: "Tax", amountCents: taxCents, quantity: 1 }] : []),
  ];

  const processor = activeProcessor();

  // --- MOCK MODE: no processor configured -> mark paid without a charge. ---
  // Blocked in production so the live store can never hand out free product.
  if (processor === "mock") {
    if (mockCheckoutBlocked()) {
      return NextResponse.json(
        { error: "Online payments are not available right now. Please try again later." },
        { status: 503 }
      );
    }
    await markOrderPaid(order.id, { provider: "mock" });
    return NextResponse.json({
      url: `${siteUrl()}/checkout/success?order=${order.orderNumber}&mock=1`,
      mock: true,
    });
  }

  // --- SQUARE (primary): hosted payment link. ---
  if (processor === "square") {
    try {
      const { url, squareOrderId } = await createSquarePaymentLink({
        idempotencyKey: order.id,
        referenceId: order.id,
        currency: settings.currency,
        buyerEmail: email.toLowerCase(),
        lineItems: checkoutLines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          amountCents: l.amountCents,
        })),
        redirectUrl: `${siteUrl()}/checkout/success?order=${order.orderNumber}&provider=square`,
        note: `Kava Life order ${order.orderNumber}`,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { squareOrderId, paymentProvider: "square" },
      });

      return NextResponse.json({ url });
    } catch (err) {
      console.error("Square checkout error:", err);
      return NextResponse.json(
        { error: "Could not start checkout. Please try again." },
        { status: 502 }
      );
    }
  }

  // --- STRIPE (fallback): hosted Checkout Session. ---
  if (!stripe) {
    return NextResponse.json(
      { error: "Online payments are not available right now. Please try again later." },
      { status: 503 }
    );
  }
  const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] =
    checkoutLines.map((l) => ({
      price_data: {
        currency: settings.currency,
        product_data: { name: l.name },
        unit_amount: l.amountCents,
      },
      quantity: l.quantity,
    }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: email.toLowerCase(),
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      success_url: `${siteUrl()}/checkout/success?order=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout?canceled=1`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id, paymentProvider: "stripe" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 }
    );
  }
}
