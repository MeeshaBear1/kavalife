import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-hero-tropic px-6 text-center text-white">
      <div>
        <p className="text-7xl">🌴</p>
        <h1 className="mt-4 font-display text-5xl font-extrabold">404</h1>
        <p className="mt-2 text-white/90">This page drifted off to the islands.</p>
        <Link href="/" className="btn mt-8 bg-white px-8 py-3.5 text-kava-700 hover:bg-cream">
          Take me home
        </Link>
      </div>
    </main>
  );
}
