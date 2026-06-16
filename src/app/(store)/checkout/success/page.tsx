import Link from "next/link";
import { prisma } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { isSquareConfigured, retrieveSquareOrder } from "@/lib/square";
import { markOrderPaid } from "@/lib/orders";
import { formatCents } from "@/lib/money";
import { ClearCart } from "@/components/store/ClearCart";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    order?: string;
    session_id?: string;
    mock?: string;
    provider?: string;
  }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp.order;

  let order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } })
    : null;

  // No-webhook fallback: confirm via the Stripe session if still pending.
  if (order && order.status === "PENDING" && sp.session_id && isStripeConfigured && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sp.session_id);
      if (session.payment_status === "paid") {
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        await markOrderPaid(order.id, { paymentIntentId: pi, provider: "stripe" });
        order = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
      }
    } catch {
      /* ignore — webhook will reconcile */
    }
  }

  // No-webhook fallback for Square: confirm via the Square order if still pending.
  if (
    order &&
    order.status === "PENDING" &&
    order.squareOrderId &&
    isSquareConfigured
  ) {
    const sq = await retrieveSquareOrder(order.squareOrderId);
    if (sq && (sq.state === "COMPLETED" || sq.netAmountDueCents === 0)) {
      await markOrderPaid(order.id, { provider: "square" });
      order = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    }
  }

  if (!order) {
    return (
      <section className="section">
        <div className="container-kl">
          <div className="mx-auto max-w-md rounded-3xl bg-white p-12 text-center shadow-card">
            <span className="text-5xl">🤔</span>
            <h1 className="mt-4 font-display text-2xl font-bold">Order not found</h1>
            <p className="mt-2 text-ink/60">
              We couldn&apos;t locate that order. If you were charged, check your email for a receipt.
            </p>
            <Link href="/shop" className="btn-primary mt-6">
              Back to shop
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const paid = order.status === "PAID" || order.status === "FULFILLED";

  return (
    <section className="section">
      <ClearCart />
      <div className="container-kl max-w-2xl">
        <div className="rounded-4xl bg-white p-8 text-center shadow-card sm:p-12">
          <span className="grid mx-auto h-16 w-16 place-items-center rounded-full bg-kava-100 text-3xl">
            🌺
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold">Mahalo for your order!</h1>
          <p className="mt-2 text-ink/60">
            {paid
              ? "Your payment was received. A confirmation is on its way to your inbox."
              : "Your order was placed and is awaiting payment confirmation."}
          </p>

          <div className="mt-6 inline-flex flex-col items-center rounded-2xl bg-cream px-6 py-4">
            <span className="text-xs uppercase tracking-wider text-ink/50">Order number</span>
            <span className="font-display text-lg font-extrabold tracking-wide">{order.orderNumber}</span>
          </div>

          <ul className="mt-8 divide-y divide-sand text-left">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-3">
                <span className="text-sm">
                  {item.name} <span className="text-ink/50">× {item.quantity}</span>
                </span>
                <span className="text-sm font-semibold">{formatCents(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-sand pt-4 text-left text-sm">
            <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
            <Row label="Shipping" value={order.shippingCents ? formatCents(order.shippingCents) : "Free"} />
            {order.taxCents ? <Row label="Tax" value={formatCents(order.taxCents)} /> : null}
            <div className="flex justify-between pt-2 font-display text-base font-extrabold">
              <span>Total</span>
              <span>{formatCents(order.totalCents)}</span>
            </div>
          </div>

          <Link href="/shop" className="btn-primary mt-8">
            Continue shopping
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
