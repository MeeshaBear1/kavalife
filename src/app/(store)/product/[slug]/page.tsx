import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getProductBySlug, CATEGORY_LABELS } from "@/lib/products";
import { ProductImage } from "@/components/ui/ProductImage";
import { StarRating } from "@/components/ui/StarRating";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ProductCard } from "@/components/store/ProductCard";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { active: true, category: product.category, id: { not: product.id } },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });

  const soldOut = product.stock <= 0;

  return (
    <>
      <section className="section">
        <div className="container-kl">
          <Link href="/shop" className="text-sm font-medium text-ink/50 hover:text-kava-600">
            ← Back to shop
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-4xl bg-white shadow-card">
              <div className="aspect-square">
                <ProductImage
                  name={product.name}
                  flavor={product.flavor}
                  imageUrl={product.imageUrl}
                  accentColor={product.accentColor}
                  category={product.category}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="eyebrow">{CATEGORY_LABELS[product.category]}</span>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {product.name}
              </h1>
              <StarRating rating={product.rating} reviewCount={product.reviewCount} className="mt-3" />

              <div className="mt-5 flex items-center gap-3">
                <span className="font-display text-3xl font-extrabold">
                  {formatCents(product.priceCents)}
                </span>
                {product.compareAtCents ? (
                  <span className="text-lg text-ink/40 line-through">
                    {formatCents(product.compareAtCents)}
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-ink/70">
                {product.description ?? product.shortDescription}
              </p>

              <div className="mt-6">
                {soldOut ? (
                  <p className="rounded-xl bg-sand px-4 py-3 text-sm font-semibold text-ink/60">
                    This flavor is currently sold out. Check back soon!
                  </p>
                ) : (
                  <AddToCartButton
                    withQuantity
                    product={{
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      flavor: product.flavor,
                      priceCents: product.priceCents,
                      imageUrl: product.imageUrl,
                      accentColor: product.accentColor,
                      stock: product.stock,
                    }}
                  />
                )}
              </div>

              <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["🌿", "Noble Kava only"],
                  ["☀️", "Zero hangover"],
                  ["🔬", "Lab-tested purity"],
                  ["🚫", "No alcohol"],
                ].map(([icon, label]) => (
                  <li key={label} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-soft">
                    <span>{icon}</span>
                    <span className="font-medium text-ink/80">{label}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs text-ink/45">
                These statements have not been evaluated by the FDA. This product is not intended to
                diagnose, treat, cure, or prevent any disease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section bg-cream pt-0">
          <div className="container-kl">
            <h2 className="mb-6 font-display text-2xl font-bold">You might also like</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
