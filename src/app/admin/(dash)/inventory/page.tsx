import Link from "next/link";
import { StockReason } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isLowStock } from "@/lib/products";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";
import AdjustStockForm from "@/components/admin/AdjustStockForm";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

const REASON_STYLES: Record<StockReason, string> = {
  INITIAL: "bg-grape/10 text-grape",
  RESTOCK: "bg-kava-50 text-kava-700",
  SALE: "bg-skyblue/10 text-skyblue",
  ADJUSTMENT: "bg-sunset-400/20 text-sunset-600",
  RETURN: "bg-lagoon-300/20 text-lagoon-600",
};

const REASON_LABELS: Record<StockReason, string> = {
  INITIAL: "Initial",
  RESTOCK: "Restock",
  SALE: "Sale",
  ADJUSTMENT: "Adjustment",
  RETURN: "Return",
};

function statusFor(stock: number, low: boolean): { label: string; cls: string } {
  if (stock <= 0) return { label: "Out", cls: "bg-coral/15 text-coral" };
  if (low) return { label: "Low", cls: "bg-sunset-400/20 text-sunset-600" };
  return { label: "OK", cls: "bg-kava-50 text-kava-700" };
}

export default async function InventoryPage() {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ stock: "asc" }, { name: "asc" }],
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const lowCount = products.filter((p) => isLowStock(p)).length;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Inventory"
        subtitle={
          lowCount > 0
            ? `${lowCount} product${lowCount === 1 ? "" : "s"} at or below threshold.`
            : "All products are above their low-stock threshold."
        }
      />

      {/* Stock table */}
      <section className="card-surface overflow-hidden">
        <div className="border-b border-sand px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Stock levels</h2>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-ink/70">No products yet</p>
            <p className="mt-1 text-sm text-ink/45">
              <Link href="/admin/products/new" className="font-semibold text-kava-600 hover:underline">
                Add a product
              </Link>{" "}
              to start tracking inventory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/45">
                  <th className="px-6 py-3.5 font-semibold">Product</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Stock</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Threshold</th>
                  <th className="px-6 py-3.5 text-center font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {products.map((p) => {
                  const low = isLowStock(p);
                  const s = statusFor(p.stock, low);
                  const out = p.stock <= 0;
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "align-top transition",
                        out ? "bg-coral/5" : low ? "bg-sunset-400/5" : "hover:bg-cream/60"
                      )}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-semibold text-ink hover:text-kava-700"
                        >
                          {p.name}
                        </Link>
                        {p.sku ? (
                          <p className="font-mono text-xs text-ink/40">{p.sku}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-center text-base font-bold text-ink">
                        {p.stock}
                      </td>
                      <td className="px-6 py-4 text-center text-ink/50">
                        {p.lowStockThreshold}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-bold",
                            s.cls
                          )}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <AdjustStockForm productId={p.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Movements feed */}
      <section className="card-surface mt-8 overflow-hidden">
        <div className="border-b border-sand px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Recent stock movements</h2>
          <p className="mt-0.5 text-sm text-ink/45">The append-only inventory audit trail.</p>
        </div>

        {movements.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink/60">No movements yet</p>
            <p className="mt-1 text-sm text-ink/40">
              Adjustments and sales will be logged here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sand/70">
            {movements.map((m) => {
              const added = m.delta > 0;
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3.5"
                >
                  <span
                    className={cn(
                      "w-14 shrink-0 text-right font-mono text-sm font-bold",
                      added ? "text-kava-600" : "text-coral"
                    )}
                  >
                    {added ? "+" : ""}
                    {m.delta}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">
                      {m.product?.name ?? "Deleted product"}
                    </span>
                    {m.note ? (
                      <span className="block truncate text-xs text-ink/45">{m.note}</span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      REASON_STYLES[m.reason]
                    )}
                  >
                    {REASON_LABELS[m.reason]}
                  </span>
                  <span className="shrink-0 text-sm text-ink/50">
                    bal <span className="font-semibold text-ink/80">{m.balance}</span>
                  </span>
                  <span className="w-28 shrink-0 text-right text-xs text-ink/40">
                    {fmtDate(m.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
