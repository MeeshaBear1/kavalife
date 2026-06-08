import Link from "next/link";
import type { Category } from "@prisma/client";
import { ProductCard } from "@/components/store/ProductCard";
import {
  getActiveProducts,
  getProductsByCategory,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description: "Shop premium Noble Kava seltzers, shots, and gummies.",
};

function isCategory(v: string | undefined): v is Category {
  return !!v && (CATEGORY_ORDER as string[]).includes(v);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const category = isCategory(sp.category) ? sp.category : null;
  const products = category ? await getProductsByCategory(category) : await getActiveProducts();

  const tabs: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: "/shop", active: !category },
    ...CATEGORY_ORDER.map((c) => ({
      label: CATEGORY_LABELS[c],
      href: `/shop?category=${c}`,
      active: category === c,
    })),
  ];

  return (
    <>
      <section className="bg-hero-tropic">
        <div className="container-kl py-16 text-center text-white sm:py-20">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Shop Kava Life</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Premium Noble Kava. Zero compromises. Maximum results.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-kl">
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={
                  t.active
                    ? "rounded-full bg-kava-500 px-5 py-2 text-sm font-semibold text-white shadow-soft"
                    : "rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink/70 ring-1 ring-sand transition hover:ring-kava-300"
                }
              >
                {t.label}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl bg-white p-14 text-center shadow-card">
              <p className="text-5xl">🌿</p>
              <p className="mt-4 font-display text-lg font-semibold">No products here yet</p>
              <p className="mt-1 text-ink/60">We&apos;re restocking — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
