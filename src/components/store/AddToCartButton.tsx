"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export type BuyableProduct = {
  productId: string;
  slug: string;
  name: string;
  flavor?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  accentColor?: string | null;
  stock: number;
};

export function AddToCartButton({
  product,
  withQuantity = false,
  className,
}: {
  product: BuyableProduct;
  withQuantity?: boolean;
  className?: string;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  if (soldOut) {
    return (
      <button
        disabled
        className={cn("btn w-full cursor-not-allowed bg-sand px-5 py-3 text-ink/50", className)}
      >
        Sold out
      </button>
    );
  }

  function add() {
    const { productId, slug, name, flavor, priceCents, imageUrl, accentColor } = product;
    addItem({ productId, slug, name, flavor, priceCents, imageUrl, accentColor }, withQuantity ? qty : 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }

  if (withQuantity) {
    return (
      <div className={cn("flex items-stretch gap-3", className)}>
        <div className="flex items-center rounded-full border border-sand bg-white">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-12 w-11 place-items-center text-lg text-ink/60 hover:text-kava-600"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            className="grid h-12 w-11 place-items-center text-lg text-ink/60 hover:text-kava-600"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button onClick={add} className="btn-primary flex-1 py-3">
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={add} className={cn("btn-primary w-full", className)}>
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}
