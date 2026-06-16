import Link from "next/link";
import { prisma } from "@/lib/db";
import { isSquareConfigured, getPayment, getOrder } from "@/lib/square";
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
    transactionId?: string;
    orderId?: string;
    mock?: string;
    reserved?: string;
  }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp.order;

  let order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } })
    : null;

  // No-webhook fallback: confirm via Square if the order is still pending.
  // `transactionId` is the Square payment id Square appends to the redirect URL;
  // we also fall back to the stored Square order id. The webhook is authoritative
  // — this just lets the page show "paid" immediately when the buyer returns.
  if (order && order.status === "PENDING" && isSquareConfigured) {
    try {
      let paid = false;
      let paymentRef: string | undefined;

      if (sp.transactionId) {
        const payment = await getPayment(sp.transactionId);
        if (payment?.status === "COMPLETED") {
          paid = true;
          paymentRef = payment.id;
        }
      }
      if (!paid && order.paymentSessionId) {
        const sqOrder = await getOrder(order.paymentSessionId);
        if (sqOrder?.paid) paid = true;
      }

      if (paid) {
        await markOrderPaid(order.id, { paymentRef });
        order = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
      }
    } catch {
      /* ignore — webhook will reconcile */
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
  // Reserve mode: the order was recorded but no charge was taken — the seller
  // follows up to collect payment. Show that clearly instead of "awaiting payment".
  const reserved = !paid && sp.reserved === "1";

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
              : reserved
                ? "We've got your order — and you haven't been charged anything yet."
                : "Your order was placed and is awaiting payment confirmation."}
          </p>

          {reserved ? (
            <div className="mt-6 rounded-2xl bg-kava-50 px-5 py-4 text-left text-sm text-ink/75 ring-1 ring-kava-100">
              <p className="font-semibold text-kava-700">What happens next</p>
              <p className="mt-1">
                We&apos;ll reach out to <span className="font-medium">{order.email}</span>
                {order.phone ? <> (or <span className="font-medium">{order.phone}</span>)</> : null}{" "}
                within one business day to confirm your order and arrange payment. Nothing
                is charged until you say go.
              </p>
            </div>
          ) : null}

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
