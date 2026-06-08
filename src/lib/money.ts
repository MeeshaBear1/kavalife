export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);
}

export function dollarsToCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): string {
  return ((cents || 0) / 100).toFixed(2);
}
