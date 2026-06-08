import Link from "next/link";
import { ProductCard } from "@/components/store/ProductCard";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ProductRecord } from "@/lib/products";
import type { Category } from "@prisma/client";

export function PickYourChill({ grouped }: { grouped: Map<Category, ProductRecord[]> }) {
  const hasAny = CATEGORY_ORDER.some((c) => (grouped.get(c)?.length ?? 0) > 0);

  return (
    <section id="shop" className="section">
      <div className="container-kl">
        <div className="text-center">
          <span className="eyebrow">Pick Your Chill</span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find your flavor
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">
            Gummies, shots, or seltzers — all packed with premium Noble Kava.
          </p>
        </div>

        {!hasAny ? (
          <div className="mt-12 rounded-3xl bg-white p-12 text-center shadow-card">
            <p className="font-display text-lg font-semibold">The shelves are being restocked 🌿</p>
            <p className="mt-2 text-ink/60">Check back soon — new kava drops are on the way.</p>
          </div>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat) ?? [];
            if (!items.length) return null;
            return (
              <div key={cat} className="mt-14">
                <div className="mb-5 flex items-end justify-between">
                  <h3 className="font-display text-2xl font-bold">{CATEGORY_LABELS[cat]}</h3>
                  <Link
                    href={`/shop?category=${cat}`}
                    className="text-sm font-semibold text-kava-700 transition hover:text-kava-800 hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                  {items.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
