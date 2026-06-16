"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { ProductImage } from "@/components/ui/ProductImage";

/**
 * `reserve` = true when the store is in "reserve order" mode (no live card
 * processor): the customer places an order and we follow up to take payment,
 * so the copy must not promise an immediate charge or "Secured by Square".
 */
export default function CheckoutForm({ reserve = false }: { reserve?: boolean }) {
  const { items, subtotalCents, hydrated } = useCart();
  const [form, setForm] = useState({
    email: "",
    customerName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("canceled")) {
      setCanceled(true);
    }
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          email: form.email,
          customerName: form.customerName || undefined,
          phone: form.phone || undefined,
          shippingAddress: form.line1
            ? {
                line1: form.line1,
                line2: form.line2 || undefined,
                city: form.city,
                state: form.state,
                postalCode: form.postalCode,
                country: form.country || "US",
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setSubmitting(false);
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <section className="section">
        <div className="container-kl">
          <div className="mx-auto max-w-md rounded-3xl bg-white p-12 text-center shadow-card">
            <span className="text-6xl">🛒</span>
            <h1 className="mt-4 font-display text-2xl font-bold">Nothing to check out</h1>
            <p className="mt-2 text-ink/60">Your cart is empty.</p>
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
        <h1 className="mb-8 font-display text-3xl font-extrabold sm:text-4xl">Checkout</h1>

        {canceled ? (
          <div className="mb-6 rounded-2xl bg-sunny/30 px-5 py-3 text-sm font-medium text-ink/80">
            Your previous checkout was canceled — no worries, your cart is still here.
          </div>
        ) : null}

        {reserve ? (
          <div className="mb-6 rounded-2xl bg-kava-50 px-5 py-4 text-sm text-ink/75 ring-1 ring-kava-100">
            <span className="font-semibold text-kava-700">Reserve your order — pay later.</span>{" "}
            Place your order now and we&apos;ll reach out to confirm details and arrange payment.
            You won&apos;t be charged anything today.
          </div>
        ) : null}

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <fieldset className="rounded-3xl bg-white p-6 shadow-card">
              <legend className="px-2 font-display text-lg font-bold">Contact</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Email *</label>
                  <input type="email" required value={form.email} onChange={update("email")} className="field" placeholder="you@email.com" />
                </div>
                <div>
                  <label className="label">Full name</label>
                  <input value={form.customerName} onChange={update("customerName")} className="field" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="label">
                    Phone{reserve ? " *" : ""}
                  </label>
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    className="field"
                    placeholder="(555) 555-5555"
                    required={reserve}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-3xl bg-white p-6 shadow-card">
              <legend className="px-2 font-display text-lg font-bold">Shipping address</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input value={form.line1} onChange={update("line1")} className="field" placeholder="123 Aloha St" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Apartment, suite, etc. (optional)</label>
                  <input value={form.line2} onChange={update("line2")} className="field" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input value={form.city} onChange={update("city")} className="field" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input value={form.state} onChange={update("state")} className="field" />
                </div>
                <div>
                  <label className="label">ZIP / Postal</label>
                  <input value={form.postalCode} onChange={update("postalCode")} className="field" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input value={form.country} onChange={update("country")} className="field" maxLength={2} />
                </div>
              </div>
            </fieldset>

            {error ? (
              <p className="rounded-2xl bg-coral/15 px-5 py-3 text-sm font-medium text-coral">{error}</p>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Order Summary</h2>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream">
                      <ProductImage
                        name={item.name}
                        flavor={item.flavor}
                        imageUrl={item.imageUrl}
                        accentColor={item.accentColor}
                        showFlavor={false}
                      />
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-forest px-1 text-[11px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <span className="flex-1 text-sm leading-tight">{item.name}</span>
                    <span className="text-sm font-semibold">
                      {formatCents(item.priceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-sand pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink/60">Subtotal</span>
                  <span className="font-semibold">{formatCents(subtotalCents)}</span>
                </div>
                <p className="mt-2 text-xs text-ink/50">
                  Shipping &amp; tax are calculated and confirmed{reserve ? " when we reach out" : " before payment"}.
                </p>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
                {reserve
                  ? submitting
                    ? "Placing order…"
                    : "Place order"
                  : submitting
                    ? "Starting checkout…"
                    : "Continue to payment"}
              </button>
              <p className="mt-3 text-center text-xs text-ink/45">
                {reserve
                  ? "You won't be charged now. We'll contact you to confirm your order and arrange payment."
                  : "Secured by Square. You won't be charged until you confirm."}
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
