import Link from "next/link";

/* ------------------------------- icons -------------------------------- */
function Check({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function Cross({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* -------------------------------- Hero -------------------------------- */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-tropic">
      <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-10 bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="container-kl relative z-10 flex flex-col items-center py-24 text-center text-white sm:py-32">
        <span className="mb-5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
          🌺 The world's purest Noble Kava
        </span>
        <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.03] drop-shadow-sm sm:text-6xl lg:text-7xl">
          Feel Everything.
          <br />
          Regret Nothing.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/90 sm:text-xl">
          The world&apos;s purest kava — zero alcohol, zero hangover, 100% vibe.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/shop" className="btn bg-white px-8 py-3.5 text-base text-kava-700 shadow-lift hover:-translate-y-0.5 hover:bg-cream">
            Shop Now
          </Link>
          <Link href="/why-kava" className="btn-ghost-light px-8 py-3.5 text-base">
            What&apos;s Kava?
          </Link>
        </div>
      </div>
      <div className="relative z-10 -mb-1">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="block h-12 w-full sm:h-20" fill="#FBF8F2">
          <path d="M0,40 C240,80 480,0 720,30 C960,60 1200,90 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------ TrustBar ------------------------------ */
const TRUST = [
  { icon: "🌿", label: "3,000 Years of Tradition" },
  { icon: "🔬", label: "Lab-Tested Noble Kava" },
  { icon: "☀️", label: "Zero Hangover Formula" },
  { icon: "🚚", label: "Free Shipping over $50" },
];

export function TrustBar() {
  return (
    <section className="bg-cream pb-4">
      <div className="container-kl grid grid-cols-2 gap-4 rounded-3xl bg-white p-5 shadow-card sm:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center justify-center gap-2 text-center">
            <span className="text-xl">{t.icon}</span>
            <span className="text-sm font-semibold text-ink/80">{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- ChillSegments ---------------------------- */
const SEGMENTS = [
  {
    emoji: "🥳",
    title: "For the Social Scene",
    body: "All the good vibes of a night out — none of the next-day regret. Crack a seltzer and stay in the moment.",
    cta: { href: "/mocktails", label: "Explore Mocktails" },
    accent: "from-sunset-400/30 to-sunset-500/10",
  },
  {
    emoji: "🧠",
    title: "For the High Performer",
    body: "Calm, clear focus with 100mg L-Theanine. Lock in without the jitters or the crash.",
    cta: { href: "/why-kava#focus", label: "Learn About Focus" },
    accent: "from-lagoon-400/30 to-lagoon-500/10",
  },
  {
    emoji: "🧘",
    title: "For the Wellness Seeker",
    body: "Melt the stress of the day. Noble Kava for a calm body and a quiet mind, naturally.",
    cta: { href: "/why-kava#anxiety", label: "Discover Calm" },
    accent: "from-kava-400/30 to-kava-500/10",
  },
];

export function ChillSegments() {
  return (
    <section className="section bg-cream">
      <div className="container-kl">
        <div className="text-center">
          <span className="eyebrow">Whatever the moment</span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            There&apos;s a kava for that
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SEGMENTS.map((s) => (
            <div key={s.title} className={`flex flex-col rounded-3xl bg-gradient-to-br ${s.accent} p-7 shadow-soft`}>
              <span className="text-4xl">{s.emoji}</span>
              <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">{s.body}</p>
              <Link href={s.cta.href} className="mt-5 inline-flex w-fit items-center gap-1 font-semibold text-kava-700 hover:underline">
                {s.cta.label} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- WhyKavaLife ----------------------------- */
const COMPARE_COLS = ["Alcohol", "CBD", "Melatonin"] as const;
const COMPARE_ROWS: { feature: string; others: boolean[] }[] = [
  { feature: "Hangover-Free", others: [false, true, true] },
  { feature: "Non-Habit Forming", others: [false, true, false] },
  { feature: "Mental Clarity", others: [false, false, false] },
  { feature: "Natural Ingredients", others: [false, true, true] },
  { feature: "Social-Ready", others: [true, false, false] },
];

export function WhyKavaLife() {
  return (
    <section className="section bg-cream">
      <div className="container-kl">
        <div className="text-center">
          <span className="eyebrow">The honest comparison</span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Why Kava Life?</h2>
        </div>

        <div className="mx-auto mt-10 max-w-3xl overflow-x-auto">
          <div className="min-w-[560px] overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="grid grid-cols-5 border-b border-sand bg-cream/60">
              <div className="p-4" />
              {COMPARE_COLS.map((c) => (
                <div key={c} className="p-4 text-center font-display text-sm font-semibold text-ink/60">
                  {c}
                </div>
              ))}
              <div className="bg-kava-500 p-4 text-center font-display text-sm font-bold text-white">Kava Life</div>
            </div>
            {COMPARE_ROWS.map((row, idx) => (
              <div key={row.feature} className={`grid grid-cols-5 ${idx % 2 ? "bg-cream/40" : "bg-white"}`}>
                <div className="p-4 text-sm font-semibold text-ink/80">{row.feature}</div>
                {row.others.map((v, i) => (
                  <div key={i} className="flex items-center justify-center p-4">
                    {v ? <Check className="text-kava-400" /> : <Cross className="text-ink/25" />}
                  </div>
                ))}
                <div className="flex items-center justify-center bg-kava-50 p-4">
                  <Check className="text-kava-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- NotAllKava ----------------------------- */
const NOBLE = [
  "Premium, ceremonial-grade root",
  "Smooth, calming effects",
  "Safe for daily enjoyment",
  "No “kava hangover”",
  "Higher noble kavalactones",
];
const TUDEI = [
  "Lower-grade, cheaper root",
  "Harsh, heavy effects",
  "Not for regular use",
  "Causes nausea & hangover",
  "Inferior kavalactone profile",
];

export function NotAllKava() {
  return (
    <section className="section bg-forest text-cream">
      <div className="container-kl">
        <div className="text-center">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-lagoon-300">
            Quality matters
          </span>
          <h2 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Not All Kava Is Created Equal
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-cream/70">
            We only use <strong className="text-white">Noble Kava</strong> — the premium, traditionally
            cultivated variety. Most cheap kava is Tudei (&ldquo;two-day&rdquo;) kava. Here&apos;s the difference.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-kava-400/40 bg-kava-900/40 p-7">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-kava-400 px-3 py-1 text-xs font-bold uppercase text-forest-deep">
                Noble Kava
              </span>
              <span className="text-sm text-cream/60">What we use</span>
            </div>
            <ul className="mt-5 space-y-3">
              {NOBLE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 shrink-0 text-kava-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-7">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-cream/70">
                Tudei Kava
              </span>
              <span className="text-sm text-cream/50">What we never touch</span>
            </div>
            <ul className="mt-5 space-y-3">
              {TUDEI.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-cream/60">
                  <Cross className="mt-0.5 shrink-0 text-coral" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Nanotech ------------------------------ */
const NANO = [
  { title: "No Bitter Taste", body: "Our nano-extraction strips the harsh bitterness, so every sip actually tastes incredible.", color: "bg-lagoon-500" },
  { title: "No Sediment", body: "No gritty, muddy texture. Just smooth, clean, crystal-clear kava.", color: "bg-sunset-500" },
  { title: "Max Bioavailability", body: "Nano-sized kavalactones absorb faster — so you feel the calm sooner.", color: "bg-kava-500" },
];

export function Nanotech() {
  return (
    <section className="section bg-cream">
      <div className="container-kl">
        <div className="text-center">
          <span className="eyebrow">The technology</span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Our Secret Weapon: Patented Nanotechnology
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink/60">
            Traditional kava is gritty and bitter. Ours isn&apos;t. Here&apos;s why.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {NANO.map((n) => (
            <div key={n.title} className="overflow-hidden rounded-3xl bg-white shadow-card">
              <div className={`${n.color} h-2 w-full`} />
              <div className="p-7">
                <h3 className="font-display text-xl font-bold uppercase tracking-tight">{n.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Nootropic ----------------------------- */
export function Nootropic() {
  return (
    <section className="section">
      <div className="container-kl">
        <div className="mx-auto max-w-3xl rounded-4xl bg-forest p-10 text-center text-cream sm:p-14">
          <span className="text-4xl">🧠</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            Kava: The Natural Nootropic
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-cream/80">
            Beyond calm, kava is prized for supporting focus and a clear, present mind. It&apos;s the
            rare botanical that relaxes the body while keeping your head switched on — your new
            favorite way to take the edge off and still get things done.
          </p>
          <p className="mt-6 text-xs text-cream/50">
            These statements have not been evaluated by the FDA. This product is not intended to
            diagnose, treat, cure, or prevent any disease.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ OurStory ------------------------------ */
export function OurStory() {
  return (
    <section className="section bg-cream">
      <div className="container-kl grid items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <span className="eyebrow">Our Story</span>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Surfers, builders &amp; dreamers
          </h2>
          <p className="mt-4 text-ink/70">
            We&apos;re a crew of surfers, builders, and dreamers from the Pacific Northwest who fell in
            love with kava on the islands. We came home wanting that same easy, social calm — without
            the booze and the brutal mornings.
          </p>
          <p className="mt-4 text-ink/70">
            So we partnered with farmers who&apos;ve grown Noble Kava for generations, paired their root
            with modern nano-extraction, and built the cleanest, best-tasting kava we could. No
            shortcuts. No Tudei. Just the good stuff.
          </p>
          <Link href="/about" className="btn-secondary mt-6 w-fit">
            Read our full story
          </Link>
        </div>
        <div className="order-1 lg:order-2">
          <div
            className="flex aspect-[4/3] items-center justify-center rounded-4xl shadow-card"
            style={{ background: "radial-gradient(120% 120% at 30% 20%, #2dd4bf55, #1fa85c22 60%), linear-gradient(150deg, #fbbf6b33, #ffffff)" }}
          >
            <span className="text-7xl">🌴</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- WhySwitching ---------------------------- */
const BENEFITS = [
  { title: "Social Without the Hangover", body: "All the fun of a night out, none of the next-day regret.", color: "bg-sunset-500", id: "alcohol" },
  { title: "Anxiety, Goodbye", body: "Kava is famous for melting away stress and easing the mind.", color: "bg-coral", id: "anxiety" },
  { title: "Mental Clarity", body: "Calm body, clear head. Stay present without the fog.", color: "bg-lagoon-500", id: "focus" },
  { title: "Actually Effective", body: "You genuinely feel it. No placebo, no waiting around.", color: "bg-kava-500" },
  { title: "Tastes Incredible", body: "Tropical flavors that don't taste like a science project.", color: "bg-grape" },
  { title: "Clean Ingredients", body: "No alcohol, no junk — just Noble Kava and real flavor.", color: "bg-skyblue" },
  { title: "Better Sleep", body: "Wind down naturally and wake up actually rested.", color: "bg-sunny", id: "sleep" },
];

export function WhySwitching() {
  return (
    <section className="section bg-cream">
      <div className="container-kl">
        <div className="text-center">
          <span className="eyebrow">The vibe shift</span>
          <h2 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Why Everyone&apos;s Switching to Kava
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} id={b.id} className={`${b.color} scroll-mt-24 rounded-3xl p-7 text-white shadow-soft`}>
              <h3 className="font-display text-lg font-bold">{b.title}</h3>
              <p className="mt-2 text-sm text-white/90">{b.body}</p>
            </div>
          ))}
          <div className="flex items-center justify-center rounded-3xl border-2 border-dashed border-kava-300 p-7 text-center">
            <Link href="/shop" className="font-display font-bold text-kava-700 hover:underline">
              …and 50+ more reasons. Shop now →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- HonoringRoot ---------------------------- */
const OLD_WAY = ["Hand-crushed root", "Gritty &amp; bitter", "Hours of preparation", "Inconsistent strength"];
const NEW_WAY = ["Patented nano-extraction", "Smooth &amp; delicious", "Ready in seconds", "Precisely dosed, every time"];

export function HonoringRoot() {
  return (
    <section className="section">
      <div className="container-kl">
        <div className="overflow-hidden rounded-4xl bg-sunset-band p-1 shadow-lift">
          <div className="rounded-[1.9rem] bg-forest p-8 text-cream sm:p-12">
            <div className="text-center">
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-lagoon-300">
                3,000 Years of Tradition
              </span>
              <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
                Honoring the Root
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-cream/75">
                Kava has been shared in Pacific Island ceremonies for millennia. We honor that
                heritage with fair-trade partnerships and deep respect for the farmers who grow it —
                then make it accessible for modern life.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-cream/60">
                  The Old Way
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-cream/70">
                  {OLD_WAY.map((w) => (
                    <li key={w} dangerouslySetInnerHTML={{ __html: `• ${w}` }} />
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-kava-400/40 bg-kava-900/40 p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-lagoon-300">
                  The Kava Life Way
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {NEW_WAY.map((w) => (
                    <li key={w} className="flex items-start gap-2">
                      <Check className="mt-0.5 shrink-0 text-kava-300" />
                      <span dangerouslySetInnerHTML={{ __html: w }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-8 text-center font-display text-lg font-semibold text-white">
              We&apos;re not replacing tradition. We&apos;re making it accessible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
