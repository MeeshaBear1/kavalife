import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { StarRating } from "@/components/ui/StarRating";
import { AddToCartButton } from "./AddToCartButton";
import { formatCents } from "@/lib/money";
import type { ProductRecord } from "@/lib/products";
import { isLowStock } from "@/lib/products";

export function ProductCard({ product }: { product: ProductRecord }) {
  const soldOut = product.stock <= 0;
  const low = !soldOut && isLowStock(product);

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <ProductImage
          name={product.name}
          flavor={product.flavor}
          imageUrl={product.imageUrl}
          accentColor={product.accentColor}
          category={product.category}
        />
        {product.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-sunset-500 px-3 py-1 text-xs font-bold text-white shadow-soft">
            Bestseller
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold text-white">
            Sold out
          </span>
        ) : low ? (
          <span className="absolute right-3 top-3 rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">
            Low stock
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <StarRating rating={product.rating} reviewCount={product.reviewCount} className="mb-2" />
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-display text-base font-bold leading-snug text-ink transition hover:text-kava-700">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink/60">{product.shortDescription}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-extrabold text-ink">
            {formatCents(product.priceCents)}
          </span>
          {product.compareAtCents ? (
            <span className="text-sm text-ink/40 line-through">
              {formatCents(product.compareAtCents)}
            </span>
          ) : null}
        </div>

        <div className="mt-3">
          <AddToCartButton
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
        </div>
      </div>
    </div>
  );
}
