"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotalCents, setQuantity, removeItem, count } = useCart();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeCart}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-lift transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 className="font-display text-lg font-bold">Your Cart ({count})</h2>
          <button
            onClick={closeCart}
            className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-sand hover:bg-white"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="text-5xl">🛒</span>
            <p className="font-display text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-ink/60">Time to pick your chill.</p>
            <Link href="/shop" onClick={closeCart} className="btn-primary mt-2">
              Shop kava
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white"
                    >
                      <ProductImage
                        name={item.name}
                        flavor={item.flavor}
                        imageUrl={item.imageUrl}
                        accentColor={item.accentColor}
                        showFlavor={false}
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <span className="text-sm font-semibold leading-tight">{item.name}</span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-ink/40 hover:text-coral"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-sm text-ink/60">{formatCents(item.priceCents)}</span>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-sand bg-white">
                          <button
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            className="grid h-8 w-8 place-items-center text-ink/60 hover:text-kava-600"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            className="grid h-8 w-8 place-items-center text-ink/60 hover:text-kava-600"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-display text-sm font-bold">
                          {formatCents(item.priceCents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-sand px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-ink/60">Subtotal</span>
                <span className="font-display text-lg font-extrabold">{formatCents(subtotalCents)}</span>
              </div>
              <p className="mb-3 text-xs text-ink/50">Shipping & taxes calculated at checkout.</p>
              <Link href="/checkout" onClick={closeCart} className="btn-primary w-full">
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-2 block text-center text-sm font-medium text-kava-700 hover:underline"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
