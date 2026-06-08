"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/mocktails", label: "Mocktails" },
  { href: "/why-kava", label: "Why Kava?" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  const { count, openCart, hydrated } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-cream/85 backdrop-blur">
      <div className="container-kl flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-hero-tropic text-base shadow-soft">
            🌿
          </span>
          <span>
            KAVA <span className="text-kava-600">LIFE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-ink/70 transition hover:text-kava-600"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/shop" className="btn-primary hidden h-10 px-5 py-0 sm:inline-flex">
            Shop Now
          </Link>
          <button
            onClick={openCart}
            className="relative grid h-10 w-10 place-items-center rounded-full ring-1 ring-sand transition hover:bg-white"
            aria-label="Open cart"
          >
            <CartIcon />
            {hydrated && count > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-sunset-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-sand md:hidden"
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-sand bg-cream md:hidden">
          <div className="container-kl flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-sand/60 py-3 text-sm font-medium text-ink/80 last:border-0"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
