import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

function safeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/admin";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const redirectTo = safeNext(next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-forest-deep px-4 py-12">
      {/* Soft tropical glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lagoon-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-kava-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lagoon-400 to-kava-500 font-display text-xl font-extrabold text-white shadow-lift">
              K
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              Kava Life
            </span>
          </div>
          <p className="text-sm text-cream/60">Sign in to the operations console</p>
        </div>

        <div className="card-surface p-8">
          <LoginForm next={redirectTo} />
        </div>

        <p className="mt-6 text-center text-xs text-cream/40">
          Authorized personnel only · Feel everything, regret nothing
        </p>
      </div>
    </main>
  );
}
