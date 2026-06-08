// Minimal pass-through so that /admin/login renders standalone (no app shell).
// The authenticated shell + redirect lives in the (dash) route group layout,
// which does not affect the URL — pages there are still /admin, /admin/orders…
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
