import Link from "next/link";

const SHOP_LINKS = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?category=SELTZERS", label: "Seltzers" },
  { href: "/shop?category=GUMMIES", label: "Gummies" },
  { href: "/shop?category=SHOTS", label: "Shots" },
];

const LEARN_LINKS = [
  { href: "/why-kava", label: "Why Kava?" },
  { href: "/faq", label: "FAQ" },
  { href: "/mocktails", label: "Mocktails" },
  { href: "/why-kava#sleep", label: "Sleep" },
  { href: "/why-kava#anxiety", label: "Anxiety Relief" },
  { href: "/why-kava#focus", label: "ADHD & Focus" },
  { href: "/why-kava#alcohol", label: "Alcohol Alternative" },
];

export function Footer({
  storeName = "Kava Life",
  supportEmail = "aloha@kavalife.com",
}: {
  storeName?: string;
  supportEmail?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest text-cream/80">
      <div className="container-kl grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-hero-tropic">🌿</span>
            KAVA LIFE
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            Premium Noble Kava. Zero compromises. Maximum results. Crafted with aloha for the
            social scene, the high performer, and the wellness seeker.
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className="mt-4 inline-block text-sm font-medium text-lagoon-300 hover:underline"
          >
            {supportEmail}
          </a>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Learn</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LEARN_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Connect</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="transition hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <a href={`mailto:${supportEmail}`} className="transition hover:text-white">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-kl flex flex-col gap-3 py-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {storeName}. Noble Kava from The Islands. Made with aloha.</p>
          <p className="max-w-2xl sm:text-right">
            These statements have not been evaluated by the FDA. This product is not intended to
            diagnose, treat, cure, or prevent any disease.
          </p>
        </div>
      </div>
    </footer>
  );
}
