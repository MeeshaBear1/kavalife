import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Kava Life — Feel Everything. Regret Nothing.",
    template: "%s · Kava Life",
  },
  description:
    "The world's purest kava — zero alcohol, zero hangover, 100% vibe. Premium Noble Kava seltzers, shots & gummies.",
  openGraph: {
    title: "Kava Life — Feel Everything. Regret Nothing.",
    description:
      "The world's purest kava — zero alcohol, zero hangover, 100% vibe.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
