import Link from "next/link";

export const metadata = {
  title: "Mocktails",
  description: "Easy kava mocktail recipes for a calm, social buzz — zero alcohol.",
};

const RECIPES = [
  {
    name: "Island Sunset",
    emoji: "🌅",
    accent: "#f97316",
    base: "Mango Orange Seltzer",
    ingredients: ["1 Kava Life Mango Orange Seltzer", "Splash of pineapple juice", "Squeeze of lime", "Orange wheel + ice"],
  },
  {
    name: "Lagoon Cooler",
    emoji: "🏝️",
    accent: "#14b8a6",
    base: "Ginger Lime Seltzer",
    ingredients: ["1 Kava Life Ginger Lime Seltzer", "Fresh mint", "Cucumber ribbons", "Lime wedge + crushed ice"],
  },
  {
    name: "Berry Calm",
    emoji: "🫐",
    accent: "#b5468f",
    base: "Mixed Berry Seltzer",
    ingredients: ["1 Kava Life Mixed Berry Seltzer", "Muddled berries", "Splash of lemonade", "Rosemary sprig + ice"],
  },
  {
    name: "Aloha Spritz",
    emoji: "🥥",
    accent: "#f5b301",
    base: "Pineapple Coconut Seltzer",
    ingredients: ["1 Kava Life Pineapple Coconut Seltzer", "Coconut water", "Pineapple chunks", "Toasted coconut rim"],
  },
];

export default function MocktailsPage() {
  return (
    <>
      <section className="bg-hero-tropic">
        <div className="container-kl py-20 text-center text-white">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Kava Mocktails</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            All the ritual of a great cocktail — calm, social, and 100% alcohol-free.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-kl grid gap-6 sm:grid-cols-2">
          {RECIPES.map((r) => (
            <div key={r.name} className="overflow-hidden rounded-3xl bg-white shadow-card">
              <div
                className="flex h-32 items-center justify-center text-5xl"
                style={{ background: `linear-gradient(135deg, ${r.accent}33, ${r.accent}11)` }}
              >
                {r.emoji}
              </div>
              <div className="p-7">
                <h3 className="font-display text-xl font-bold">{r.name}</h3>
                <p className="mt-1 text-sm font-medium text-kava-700">Built on {r.base}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-ink/70">
                  {r.ingredients.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-kava-400">•</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="container-kl mt-12 text-center">
          <Link href="/shop?category=SELTZERS" className="btn-primary">
            Shop seltzers
          </Link>
        </div>
      </section>
    </>
  );
}
