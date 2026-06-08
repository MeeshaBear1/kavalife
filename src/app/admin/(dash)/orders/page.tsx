import Link from "next/link";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

const TABS: { label: string; status?: OrderStatus }[] = [
  { label: "All" },
  { label: "Pending", status: OrderStatus.PENDING },
  { label: "Paid", status: OrderStatus.PAID },
  { label: "Fulfilled", status: OrderStatus.FULFILLED },
  { label: "Cancelled", status: OrderStatus.CANCELLED },
  { label: "Refunded", status: OrderStatus.REFUNDED },
];

function parseStatus(raw: string | string[] | undefined): OrderStatus | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value in OrderStatus) return value as OrderStatus;
  return undefined;
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status: statusRaw } = await searchParams;
  const status = parseStatus(statusRaw);

  const where: Prisma.OrderWhereInput = status ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { items: true } } },
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        subtitle="Track, fulfill, and reconcile customer orders."
      />

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active =
            (tab.status === undefined && status === undefined) || tab.status === status;
          const href = tab.status ? `/admin/orders?status=${tab.status}` : "/admin/orders";
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-forest text-white shadow-soft"
                  : "bg-white text-ink/70 ring-1 ring-sand hover:bg-kava-50 hover:text-kava-700"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="card-surface overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-lg font-semibold text-ink/70">No orders found</p>
            <p className="mt-1 text-sm text-ink/45">
              {status
                ? "No orders match this status filter."
                : "Orders will appear here as customers check out."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/45">
                  <th className="px-6 py-3.5 font-semibold">Order</th>
                  <th className="px-6 py-3.5 font-semibold">Date</th>
                  <th className="px-6 py-3.5 font-semibold">Customer</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Items</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Total</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {orders.map((o) => (
                  <tr key={o.id} className="group transition hover:bg-cream/60">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-semibold text-kava-700 group-hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-ink/60">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="max-w-[16rem] px-6 py-3.5">
                      <span className="block truncate text-ink/90" title={o.email}>
                        {o.customerName || o.email}
                      </span>
                      {o.customerName ? (
                        <span className="block truncate text-xs text-ink/45" title={o.email}>
                          {o.email}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-3.5 text-center text-ink/70">{o._count.items}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {formatCents(o.totalCents, o.currency)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
