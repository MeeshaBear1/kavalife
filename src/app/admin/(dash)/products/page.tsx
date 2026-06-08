import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { CATEGORY_LABELS, isLowStock } from "@/lib/products";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

function Thumb({
  imageUrl,
  accentColor,
  name,
}: {
  imageUrl: string | null;
  accentColor: string | null;
  name: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-sand"
      />
    );
  }
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ring-1 ring-black/5"
      style={{
        background: `linear-gradient(135deg, ${accentColor || "#1fa85c"}, ${
          accentColor || "#168a4b"
        }cc)`,
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function StockPill({ stock, low }: { stock: number; low: boolean }) {
  const out = stock <= 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-semibold text-ink">{stock}</span>
      {out ? (
        <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-bold text-coral">
          Out
        </span>
      ) : low ? (
        <span className="rounded-full bg-sunset-400/20 px-2 py-0.5 text-xs font-bold text-sunset-600">
          Low
        </span>
      ) : null}
    </span>
  );
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        subtitle={`${products.length} item${products.length === 1 ? "" : "s"} — active and inactive.`}
      >
        <Link href="/admin/products/new" className="btn-primary">
          + New product
        </Link>
      </PageHeader>

      <div className="card-surface overflow-hidden">
        {products.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="font-display text-lg font-semibold text-ink/70">
              No products yet
            </p>
            <p className="mt-1 text-sm text-ink/45">
              Add your first product to start selling.
            </p>
            <Link href="/admin/products/new" className="btn-primary mt-6">
              + New product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand text-left text-xs uppercase tracking-wider text-ink/45">
                  <th className="px-6 py-3.5 font-semibold">Product</th>
                  <th className="px-6 py-3.5 font-semibold">Category</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Price</th>
                  <th className="px-6 py-3.5 font-semibold">Stock</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/70">
                {products.map((p) => {
                  const low = isLowStock(p);
                  return (
                    <tr key={p.id} className="group transition hover:bg-cream/60">
                      <td className="px-6 py-3.5">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                          <Thumb imageUrl={p.imageUrl} accentColor={p.accentColor} name={p.name} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink group-hover:text-kava-700">
                              {p.name}
                            </span>
                            {p.flavor ? (
                              <span className="block truncate text-xs text-ink/45">
                                {p.flavor}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-ink/70">{CATEGORY_LABELS[p.category]}</td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-right">
                        <span className="font-semibold text-ink">{formatCents(p.priceCents)}</span>
                        {p.compareAtCents != null && p.compareAtCents > p.priceCents ? (
                          <span className="ml-2 text-xs text-ink/40 line-through">
                            {formatCents(p.compareAtCents)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-3.5">
                        <StockPill stock={p.stock} low={low} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.active ? (
                            <span className="rounded-full bg-kava-50 px-2 py-0.5 text-xs font-semibold text-kava-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold text-ink/50">
                              Inactive
                            </span>
                          )}
                          {p.featured ? (
                            <span className="rounded-full bg-sunny/20 px-2 py-0.5 text-xs font-semibold text-sunset-600">
                              ★ Featured
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
