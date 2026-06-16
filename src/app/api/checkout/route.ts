import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrderPaymentLink } from "@/lib/order-payment";
import { checkoutMode } from "@/lib/checkout-mode";
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

  const mode = checkoutMode();

  // --- RESERVE MODE: record the order, collect contact info, DON'T charge. ---
  // The seller follows up to take payment, then marks it paid in the admin
  // (which deducts stock). Stock is intentionally NOT held here — a pending
  // reserve is a lead, not a confirmed sale. Used while no kava-friendly card
  // processor is connected.
  if (mode === "reserve") {
    return NextResponse.json({
      url: `${siteUrl()}/checkout/success?order=${order.orderNumber}&reserved=1`,
      reserved: true,
    });
  }

  // --- MOCK MODE: no Square keys -> mark paid immediately so the flow works. ---
  if (mode === "mock") {
    await markOrderPaid(order.id);
    return NextResponse.json({
      url: `${siteUrl()}/checkout/success?order=${order.orderNumber}&mock=1`,
      mock: true,
    });
  }

  // --- REAL SQUARE CHECKOUT (hosted payment link) ---
  // Building the link from the persisted order lives in one place so storefront
  // checkout and the admin "Collect payment" action stay in lockstep.
  try {
    const { url } = await createOrderPaymentLink(order.id);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Square checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 }
    );
  }
}
