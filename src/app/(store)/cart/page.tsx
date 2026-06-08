"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { ProductImage } from "@/components/ui/ProductImage";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem, hydrated } = useCart();

  if (hydrated && items.length === 0) {
    return (
      <section className="section">
        <div className="container-kl">
          <div className="mx-auto max-w-md rounded-3xl bg-white p-12 text-center shadow-card">
            <span className="text-6xl">🛒</span>
            <h1 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h1>
            <p className="mt-2 text-ink/60">Let&apos;s fix that.</p>
            <Link href="/shop" className="btn-primary mt-6">
              Shop kava
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-kl">
        <h1 className="mb-8 font-display text-3xl font-extrabold sm:text-4xl">Your Cart</h1>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="flex flex-col divide-y divide-sand rounded-3xl bg-white px-5 shadow-card">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${item.slug}`}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream"
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
                    <div className="flex justify-between gap-3">
                      <Link href={`/product/${item.slug}`} className="font-display font-bold hover:text-kava-700">
                        {item.name}
                      </Link>
                      <span className="font-display font-bold">
                        {formatCents(item.priceCents * item.quantity)}
                      </span>
                    </div>
                    <span className="text-sm text-ink/55">{formatCents(item.priceCents)} each</span>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-sand">
                        <button
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          className="grid h-9 w-9 place-items-center text-ink/60 hover:text-kava-600"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          className="grid h-9 w-9 place-items-center text-ink/60 hover:text-kava-600"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-sm font-medium text-ink/40 hover:text-coral"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/shop" className="mt-5 inline-block text-sm font-medium text-kava-700 hover:underline">
              ← Continue shopping
            </Link>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Order Summary</h2>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-ink/60">Subtotal</span>
                <span className="font-semibold">{formatCents(subtotalCents)}</span>
              </div>
              <p className="mt-2 text-xs text-ink/50">Shipping &amp; taxes calculated at checkout.</p>
              <Link href="/checkout" className="btn-primary mt-5 w-full">
                Proceed to checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
