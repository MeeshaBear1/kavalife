import Link from "next/link";

export const metadata = {
  title: "Why Kava?",
  description: "What kava is, how it feels, and why it's the better way to unwind.",
};

const TOPICS = [
  {
    id: "anxiety",
    emoji: "🧘",
    title: "Calm & Anxiety Relief",
    body: "Kava is famous for taking the edge off. Many people reach for it to quiet a racing mind and feel more at ease in social settings — a relaxed body and a calmer head, naturally.",
  },
  {
    id: "focus",
    emoji: "🧠",
    title: "ADHD & Focus",
    body: "Unlike alcohol, kava relaxes you without the fog. Paired with L-Theanine in our performance line, it supports calm, clear focus so you can lock in without the jitters.",
  },
  {
    id: "sleep",
    emoji: "🌙",
    title: "Better Sleep",
    body: "Wind down the natural way. A kava ritual in the evening helps many people downshift and ease into restful sleep — and wake up actually rested, with no hangover.",
  },
  {
    id: "alcohol",
    emoji: "🍹",
    title: "The Alcohol Alternative",
    body: "All the social ritual of a drink in hand — none of the next-day regret. Kava is the go-to for sober-curious nights out and everything in between.",
  },
];

export default function WhyKavaPage() {
  return (
    <>
      <section className="bg-hero-tropic">
        <div className="container-kl py-20 text-center text-white">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Why Kava?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            A 3,000-year-old plant for the way we live now — calm, social, and clear-headed.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-kl max-w-3xl text-center">
          <span className="eyebrow">The basics</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold">What is kava?</h2>
          <p className="mt-4 text-ink/75">
            Kava comes from the root of a Pacific Island plant (<em>Piper methysticum</em>). For
            millennia, islanders have brewed it into a calming drink shared in ceremonies and social
            gatherings. The active compounds — kavalactones — are what create that signature relaxed,
            sociable feeling. We use only premium <strong>Noble Kava</strong> and our patented
            nano-extraction to make it smooth, clean, and genuinely delicious.
          </p>
        </div>
      </section>

      <section className="section bg-cream pt-0">
        <div className="container-kl grid gap-6 md:grid-cols-2">
          {TOPICS.map((t) => (
            <div key={t.id} id={t.id} className="scroll-mt-24 rounded-3xl bg-white p-8 shadow-card">
              <span className="text-4xl">{t.emoji}</span>
              <h3 className="mt-3 font-display text-xl font-bold">{t.title}</h3>
              <p className="mt-2 text-ink/70">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-kl">
          <div className="rounded-4xl bg-forest p-10 text-center text-cream sm:p-14">
            <h2 className="font-display text-3xl font-extrabold">Ready to feel the difference?</h2>
            <p className="mx-auto mt-3 max-w-xl text-cream/75">
              Pick your flavor and discover your new favorite way to unwind.
            </p>
            <Link href="/shop" className="btn bg-white px-8 py-3.5 text-kava-700 hover:bg-cream">
              Shop Kava Life
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-ink/45">
            These statements have not been evaluated by the FDA. This product is not intended to
            diagnose, treat, cure, or prevent any disease.
          </p>
        </div>
      </section>
    </>
  );
}
