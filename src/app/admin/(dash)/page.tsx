import Link from "next/link";
import { OrderStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { CATEGORY_LABELS } from "@/lib/products";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function StatCard({
  label,
  value,
  sub,
  accent = "kava",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "kava" | "sunset" | "lagoon" | "coral";
  href?: string;
}) {
  const ring: Record<string, string> = {
    kava: "from-kava-400/15 to-kava-500/5 text-kava-700",
    sunset: "from-sunset-400/20 to-sunset-500/5 text-sunset-600",
    lagoon: "from-lagoon-300/25 to-lagoon-500/5 text-lagoon-600",
    coral: "from-coral/15 to-coral/5 text-coral",
  };
  const inner = (
    <div className="card-surface relative overflow-hidden p-6">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${ring[accent]} blur-xl`}
      />
      <p className="relative text-xs font-semibold uppercase tracking-wider text-ink/45">
        {label}
      </p>
      <p className="relative mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        {value}
      </p>
      {sub ? <p className="relative mt-1 text-sm text-ink/50">{sub}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Column-to-column comparison (stock <= its own lowStockThreshold).
  const lowStockWhere: Prisma.ProductWhereInput = {
    stock: { lte: prisma.product.fields.lowStockThreshold },
  };

  const [
    revenueAgg,
    paidOrFulfilledCount,
    pendingCount,
    productCount,
    lowStockCount,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] },
        paidAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.FULFILLED] } },
    }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.product.count(),
    prisma.product.count({ where: lowStockWhere }),
    prisma.product.findMany({
      where: lowStockWhere,
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { items: true } } },
    }),
  ]);

  const revenue = revenueAgg._sum.totalCents ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        subtitle="Your store at a glance — last 30 days."
      >
        <Link href="/admin/products/new" className="btn-primary">
          + New product
        </Link>
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="30-day revenue"
          value={formatCents(revenue)}
          sub="Paid & fulfilled orders"
          accent="kava"
        />
        <StatCard
          label="Paid orders"
          value={String(paidOrFulfilledCount)}
          sub="Lifetime"
          accent="lagoon"
          href="/admin/orders?status=PAID"
        />
        <StatCard
          label="Pending"
          value={String(pendingCount)}
          sub="Awaiting payment"
          accent="sunset"
          href="/admin/orders?status=PENDING"
        />
        <StatCard
          label="Low stock"
          value={String(lowStockCount)}
          sub="At or below threshold"
          accent="coral"
          href="/admin/inventory"
        />
        <StatCard
          label="Products"
          value={String(productCount)}
          sub="All catalog items"
          href="/admin/products"
        />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <section className="card-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-sand px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-kava-600 hover:text-kava-700"
            >
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-ink/60">No orders yet</p>
              <p className="mt-1 text-sm text-ink/40">
                Orders will appear here once customers check out.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/45">
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 text-right font-semibold">Total</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/70">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="group transition hover:bg-cream/60">
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-mono text-xs font-semibold text-kava-700 group-hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-ink/60">
                        {fmtDate(o.createdAt)}
                      </td>
                      <td className="max-w-[14rem] truncate px-6 py-3 text-ink/80" title={o.email}>
                        {o.email}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-ink">
                        {formatCents(o.totalCents, o.currency)}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Low stock */}
        <section className="card-surface">
          <div className="flex items-center justify-between border-b border-sand px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">Low stock</h2>
            <Link
              href="/admin/inventory"
              className="text-sm font-semibold text-kava-600 hover:text-kava-700"
            >
              Inventory →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-ink/60">All stocked up 🌴</p>
              <p className="mt-1 text-sm text-ink/40">
                Nothing is at or below its threshold.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-sand/70">
              {lowStockProducts.map((p) => {
                const out = p.stock <= 0;
                return (
                  <li key={p.id}>
                    <Link
                      href="/admin/inventory"
                      className="flex items-center justify-between gap-3 px-6 py-3 transition hover:bg-cream/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                        <p className="text-xs text-ink/45">{CATEGORY_LABELS[p.category]}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          out
                            ? "bg-coral/15 text-coral"
                            : "bg-sunset-400/20 text-sunset-600"
                        }`}
                      >
                        {out ? "Out" : `${p.stock} / ${p.lowStockThreshold}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
