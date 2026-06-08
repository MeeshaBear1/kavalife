"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/admin/(dash)/actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <path d="M6 2l1.5 3h9L18 2M3 6h18l-1.5 13.5a2 2 0 01-2 1.8H6.5a2 2 0 01-2-1.8L3 6zM9 11v5M15 11v5" />
    ),
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: (
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    ),
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    icon: (
      <path d="M3 9l9-6 9 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9h18M9 21V12h6v9" />
    ),
  },
  {
    href: "/admin/newsletter",
    label: "Newsletter",
    icon: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.81.66 1.65 1.65 0 01-3.18 0 1.65 1.65 0 00-2.81-.66l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-kava-500 text-white shadow-soft"
                : "text-cream/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-cream/60 group-hover:text-white")}
              aria-hidden
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lagoon-400 to-kava-500 font-display text-lg font-extrabold text-white shadow-soft">
        K
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Kava Life
        <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-[0.2em] text-lagoon-300">
          Admin
        </span>
      </span>
    </Link>
  );
}

function Footer({ email }: { email: string }) {
  return (
    <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
      <div className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cream/40">
          Signed in
        </p>
        <p className="truncate text-sm font-medium text-cream/90" title={email}>
          {email}
        </p>
      </div>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-cream/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
        </svg>
        View store
      </a>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-cream/70 transition-colors hover:bg-coral/20 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </form>
    </div>
  );
}

export default function AdminSidebar({
  admin,
}: {
  admin: { email: string; name: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-forest px-4 py-3 lg:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-cream/80 transition-colors hover:bg-white/10"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 bg-forest-deep p-5">
            <Wordmark />
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <Footer email={admin.email} />
          </aside>
        </div>
      ) : null}

      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 bg-forest-deep p-5 lg:flex">
        <Wordmark />
        <NavLinks pathname={pathname} />
        <Footer email={admin.email} />
      </aside>
    </>
  );
}
