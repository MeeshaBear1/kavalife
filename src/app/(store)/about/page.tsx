import Link from "next/link";

export const metadata = {
  title: "About",
  description: "Surfers, builders, and dreamers from the Pacific Northwest, crafting the world's purest Noble Kava.",
};

const VALUES = [
  { icon: "🌿", title: "Noble Kava only", body: "We never touch cheap Tudei kava. Ceremonial-grade root, every batch." },
  { icon: "🤝", title: "Fair to farmers", body: "Direct, fair-trade partnerships with growers who've farmed kava for generations." },
  { icon: "🔬", title: "Modern & clean", body: "Patented nano-extraction for smooth, consistent, lab-tested quality." },
  { icon: "💚", title: "Made with aloha", body: "We make the kava we wanted to drink ourselves — no shortcuts, no junk." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-hero-tropic">
        <div className="container-kl py-20 text-center text-white">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Our Story</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            Surfers, builders, and dreamers from the Pacific Northwest — on a mission to bring the
            islands&apos; easy, social calm to modern life.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-kl grid gap-10 lg:grid-cols-2 lg:items-center">
          <div
            className="flex aspect-[4/3] items-center justify-center rounded-4xl shadow-card"
            style={{ background: "radial-gradient(120% 120% at 30% 20%, #2dd4bf55, #1fa85c22 60%), linear-gradient(150deg, #fbbf6b33, #ffffff)" }}
          >
            <span className="text-7xl">🏄</span>
          </div>
          <div>
            <p className="text-ink/75">
              It started on a trip to the islands. After a long day in the water, the locals shared a
              bowl of kava — and we felt it instantly: relaxed, social, clear-headed, and zero buzz
              the next morning.
            </p>
            <p className="mt-4 text-ink/75">
              Back home in the Pacific Northwest, we couldn&apos;t find anything like it. The kava on
              shelves was gritty, bitter, and often the cheap Tudei variety that leaves you feeling
              worse, not better. So we decided to build it ourselves.
            </p>
            <p className="mt-4 text-ink/75">
              We partnered with Noble Kava farmers, paired their root with modern nano-extraction, and
              obsessed over taste until it was actually delicious. The result is Kava Life — the
              cleanest, smoothest, best-tasting kava we could make. We hope you love it as much as we do.
            </p>
            <Link href="/shop" className="btn-primary mt-7">
              Try it yourself
            </Link>
          </div>
        </div>
      </section>

      <section className="section bg-cream pt-0">
        <div className="container-kl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-3xl bg-white p-7 shadow-card">
                <span className="text-3xl">{v.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-ink/65">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
