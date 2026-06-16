import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isSquareConfigured } from "@/lib/square";
import { formatCents } from "@/lib/money";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import CopyLinkField from "@/components/admin/CopyLinkField";
import {
  markPaidAction,
  markFulfilledAction,
  cancelOrderAction,
  refundOrderAction,
  createPaymentLinkAction,
} from "@/app/admin/orders/actions";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Pull human-readable lines out of an arbitrary shipping-address JSON blob. */
function addressLines(address: Prisma.JsonValue | null): string[] {
  if (!address || typeof address !== "object" || Array.isArray(address)) return [];
  const a = address as Record<string, unknown>;
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = a[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return undefined;
  };

  const lines: string[] = [];
  const name = get("name", "fullName", "recipient");
  if (name) lines.push(name);

  const line1 = get("line1", "address1", "street", "address");
  if (line1) lines.push(line1);
  const line2 = get("line2", "address2", "apt", "unit");
  if (line2) lines.push(line2);

  const city = get("city", "town");
  const state = get("state", "province", "region");
  const postal = get("postalCode", "postal_code", "zip", "zipcode");
  const cityLine = [city, [state, postal].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);

  const country = get("country", "countryCode");
  if (country) lines.push(country);

  return lines;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-ink/50">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const lines = addressLines(order.shippingAddress);
  const hasRawAddress =
    lines.length === 0 &&
    order.shippingAddress != null &&
    typeof order.shippingAddress === "object";

  const canMarkPaid = order.status === OrderStatus.PENDING;
  const canFulfill = order.status === OrderStatus.PAID;
  const canCancel =
    order.status === OrderStatus.PENDING ||
    order.status === OrderStatus.PAID ||
    order.status === OrderStatus.FULFILLED;
  const canRefund =
    order.status === OrderStatus.PAID || order.status === OrderStatus.FULFILLED;
  const hasAnyAction = canMarkPaid || canFulfill || canCancel || canRefund;

  return (
    <>
      <div className="mb-2">
        <Link
          href="/admin/orders"
          className="text-sm font-semibold text-kava-600 hover:text-kava-700"
        >
          ← Back to orders
        </Link>
      </div>

      <PageHeader
        eyebrow={`Placed ${fmtDateTime(order.createdAt)}`}
        title={`Order ${order.orderNumber}`}
      >
        <StatusBadge status={order.status} className="px-3 py-1.5 text-sm" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: line items + actions */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface overflow-hidden">
            <div className="border-b border-sand px-6 py-4">
              <h2 className="font-display text-lg font-bold text-ink">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/45">
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 text-center font-semibold">Qty</th>
                    <th className="px-6 py-3 text-right font-semibold">Unit</th>
                    <th className="px-6 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/70">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-ink">{item.name}</p>
                        {item.flavor ? (
                          <p className="text-xs text-ink/45">{item.flavor}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-3.5 text-center text-ink/70">{item.quantity}</td>
                      <td className="px-6 py-3.5 text-right text-ink/70">
                        {formatCents(item.unitPriceCents, order.currency)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-ink">
                        {formatCents(item.lineTotalCents, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-sand bg-cream/50 px-6 py-4">
              <div className="ml-auto max-w-xs space-y-1">
                <InfoRow
                  label="Subtotal"
                  value={formatCents(order.subtotalCents, order.currency)}
                />
                <InfoRow
                  label="Shipping"
                  value={formatCents(order.shippingCents, order.currency)}
                />
                <InfoRow label="Tax" value={formatCents(order.taxCents, order.currency)} />
                {order.discountCents > 0 ? (
                  <InfoRow
                    label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                    value={`−${formatCents(order.discountCents, order.currency)}`}
                  />
                ) : null}
                <div className="mt-2 flex justify-between border-t border-sand pt-2.5">
                  <span className="font-display font-bold text-ink">Total</span>
                  <span className="font-display text-lg font-bold text-kava-700">
                    {formatCents(order.totalCents, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="card-surface p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">Actions</h2>
            {hasAnyAction ? (
              <div className="flex flex-wrap gap-3">
                {canMarkPaid ? (
                  <form action={markPaidAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <ConfirmSubmitButton
                      className="btn-primary"
                      pendingLabel="Marking…"
                      confirm="Mark this order as paid? Stock will be deducted."
                    >
                      Mark as paid
                    </ConfirmSubmitButton>
                  </form>
                ) : null}

                {canFulfill ? (
                  <form action={markFulfilledAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <ConfirmSubmitButton
                      className="btn bg-lagoon-500 px-6 py-3 text-white shadow-soft hover:bg-lagoon-600"
                      pendingLabel="Updating…"
                      confirm="Mark this order as fulfilled?"
                    >
                      Mark as fulfilled
                    </ConfirmSubmitButton>
                  </form>
                ) : null}

                {canRefund ? (
                  <form action={refundOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <ConfirmSubmitButton
                      className="btn bg-white px-6 py-3 text-coral ring-1 ring-coral/30 hover:bg-coral/5"
                      pendingLabel="Refunding…"
                      confirm="Refund this order? Stock will be returned to inventory."
                    >
                      Refund
                    </ConfirmSubmitButton>
                  </form>
                ) : null}

                {canCancel ? (
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <ConfirmSubmitButton
                      className="btn bg-white px-6 py-3 text-ink/60 ring-1 ring-sand hover:bg-ink/5"
                      pendingLabel="Cancelling…"
                      confirm="Cancel this order? This cannot be undone."
                    >
                      Cancel order
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink/50">
                No actions available for a {order.status.toLowerCase()} order.
              </p>
            )}
          </section>

          {/* Collect payment — process a live order's payment through Square */}
          {canMarkPaid ? (
            <section className="card-surface p-6">
              <h2 className="mb-1 font-display text-lg font-bold text-ink">Collect payment</h2>
              <p className="mb-4 text-sm text-ink/55">
                Send the customer a secure Square link to pay online, or record a
                payment you collected another way with “Mark as paid” above.
              </p>

              {order.paymentLinkUrl ? (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">
                    Square payment link
                  </p>
                  <CopyLinkField url={order.paymentLinkUrl} email={order.email} />
                  <form action={createPaymentLinkAction} className="mt-3">
                    <input type="hidden" name="id" value={order.id} />
                    <ConfirmSubmitButton
                      className="text-sm font-semibold text-kava-600 hover:text-kava-700"
                      pendingLabel="Refreshing…"
                    >
                      Regenerate link
                    </ConfirmSubmitButton>
                  </form>
                </>
              ) : isSquareConfigured ? (
                <form action={createPaymentLinkAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <ConfirmSubmitButton
                    className="btn bg-forest px-6 py-3 text-white shadow-soft hover:bg-forest/90"
                    pendingLabel="Creating link…"
                  >
                    Create Square payment link
                  </ConfirmSubmitButton>
                </form>
              ) : (
                <div className="rounded-2xl bg-sunny/20 px-4 py-3 text-sm text-ink/70 ring-1 ring-sunset-400/25">
                  Square isn’t connected yet. Add{" "}
                  <code className="font-mono text-xs">SQUARE_ACCESS_TOKEN</code> and{" "}
                  <code className="font-mono text-xs">SQUARE_LOCATION_ID</code> to send
                  pay-online links. Until then, collect payment manually and click{" "}
                  <span className="font-semibold">Mark as paid</span>.
                </div>
              )}
            </section>
          ) : null}
        </div>

        {/* Right: customer + meta */}
        <div className="space-y-6">
          <section className="card-surface p-6">
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Customer</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/40">Name</p>
                <p className="font-medium text-ink">{order.customerName || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/40">Email</p>
                <a
                  href={`mailto:${order.email}`}
                  className="font-medium text-kava-700 hover:underline"
                >
                  {order.email}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/40">Phone</p>
                <p className="font-medium text-ink">{order.phone || "—"}</p>
              </div>
            </div>
          </section>

          <section className="card-surface p-6">
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Shipping address</h2>
            {lines.length > 0 ? (
              <address className="not-italic text-sm leading-relaxed text-ink/80">
                {lines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : hasRawAddress ? (
              <pre className="overflow-x-auto rounded-xl bg-cream p-3 text-xs text-ink/70">
                {JSON.stringify(order.shippingAddress, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-ink/50">No shipping address on file.</p>
            )}
          </section>

          <section className="card-surface p-6">
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Details</h2>
            <div className="space-y-1">
              <InfoRow label="Status" value={<StatusBadge status={order.status} />} />
              <InfoRow label="Placed" value={fmtDateTime(order.createdAt)} />
              <InfoRow label="Paid" value={fmtDateTime(order.paidAt)} />
              <InfoRow label="Fulfilled" value={fmtDateTime(order.fulfilledAt)} />
              <InfoRow label="Currency" value={order.currency.toUpperCase()} />
            </div>

            {(order.paymentSessionId || order.paymentRef || order.notes) && (
              <div className="mt-4 space-y-3 border-t border-sand pt-4 text-sm">
                {order.paymentRef ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink/40">
                      Square payment ID
                    </p>
                    <p className="break-all font-mono text-xs text-ink/70">
                      {order.paymentRef}
                    </p>
                  </div>
                ) : null}
                {order.paymentSessionId ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink/40">
                      Square order ID
                    </p>
                    <p className="break-all font-mono text-xs text-ink/70">
                      {order.paymentSessionId}
                    </p>
                  </div>
                ) : null}
                {order.notes ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink/40">Notes</p>
                    <p className="text-ink/70">{order.notes}</p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
