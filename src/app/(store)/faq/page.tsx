import Link from "next/link";

export const metadata = {
  title: "FAQ",
  description: "Everything you wanted to know about kava, Noble Kava, and Kava Life.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is kava?",
    a: "Kava is a plant from the South Pacific whose root has been brewed into a calming drink for thousands of years. It's traditionally shared socially to relax the body and ease the mind — without alcohol.",
  },
  {
    q: "Will it get me drunk?",
    a: "No. Kava isn't alcohol. Most people describe the feeling as a relaxed, social calm with a clear head — the good parts of unwinding, without intoxication or a hangover.",
  },
  {
    q: "What's the difference between Noble and Tudei kava?",
    a: "Noble kava is the premium, traditionally cultivated variety prized for smooth, pleasant effects and daily enjoyment. Tudei (“two-day”) kava is a cheaper variety that can cause nausea and lingering grogginess. We only use Noble kava.",
  },
  {
    q: "What is the patented nanotechnology?",
    a: "Traditional kava is gritty and bitter. Our nano-extraction reduces kavalactones to nano-sized particles, which removes the bitterness and sediment and improves absorption — so it tastes great and you feel it sooner.",
  },
  {
    q: "Is kava safe?",
    a: "Noble kava is widely enjoyed and considered well-tolerated for most adults when used responsibly. Avoid combining it with alcohol, don't use it if you're pregnant, nursing, or have liver concerns, and talk to your doctor if you take medications. These statements have not been evaluated by the FDA.",
  },
  {
    q: "How much should I have?",
    a: "Start low and go slow — one serving and see how you feel. Effects vary from person to person.",
  },
  {
    q: "How fast do you ship?",
    a: "Orders typically ship within 1–2 business days. Shipping is free on orders over $50.",
  },
  {
    q: "What's your return policy?",
    a: "If something isn't right with your order, reach out and we'll make it right. Contact us any time at aloha@kavalife.com.",
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="bg-hero-tropic">
        <div className="container-kl py-16 text-center text-white sm:py-20">
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Everything you wanted to know about kava.</p>
        </div>
      </section>

      <section className="section">
        <div className="container-kl max-w-3xl">
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white px-6 py-5 shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display font-bold">
                  {f.q}
                  <span className="ml-4 text-kava-500 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-cream p-8 text-center">
            <p className="font-display text-lg font-bold">Still have questions?</p>
            <p className="mt-1 text-ink/60">We&apos;re happy to help.</p>
            <a href="mailto:aloha@kavalife.com" className="btn-primary mt-4">
              Email us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
