"use client";

import { useState } from "react";

type State =
  | { status: "idle" | "loading" }
  | { status: "done"; code?: string }
  | { status: "error"; msg: string };

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState({ status: "done", code: data.discountCode });
    } catch (err) {
      setState({ status: "error", msg: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <section className="section">
      <div className="container-kl">
        <div className="relative overflow-hidden rounded-4xl bg-sunset-band px-6 py-14 text-center text-white shadow-lift sm:px-12 sm:py-16">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Join the Kava Life Crew</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/90">
            Get 15% off your first order + early access to new drops, recipes, and good vibes.
          </p>

          {state.status === "done" ? (
            <div className="mx-auto mt-7 max-w-md rounded-2xl bg-white/15 p-5 backdrop-blur">
              <p className="font-display text-lg font-bold">You're in! 🌺</p>
              <p className="mt-1 text-sm text-white/90">
                {state.code
                  ? "Use this code at checkout for 15% off:"
                  : "Welcome to the crew — your 15% off is on the way."}
              </p>
              {state.code ? (
                <p className="mt-2 inline-block rounded-lg bg-white px-4 py-2 font-display text-lg font-extrabold tracking-wider text-sunset-600">
                  {state.code}
                </p>
              ) : null}
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-full border-0 px-5 py-3.5 text-ink outline-none ring-2 ring-transparent focus:ring-white"
              />
              <button
                type="submit"
                disabled={state.status === "loading"}
                className="btn shrink-0 bg-white px-7 py-3.5 text-sunset-600 hover:bg-cream disabled:opacity-70"
              >
                {state.status === "loading" ? "Joining…" : "Claim My Discount"}
              </button>
            </form>
          )}

          {state.status === "error" ? (
            <p className="mt-3 text-sm text-white">{state.msg}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
