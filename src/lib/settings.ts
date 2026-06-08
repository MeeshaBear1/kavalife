import { prisma } from "./db";

export async function getSettings() {
  const existing = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.storeSettings.create({ data: { id: 1 } });
}

export type StoreSettings = Awaited<ReturnType<typeof getSettings>>;

/** Compute shipping for a given subtotal using the store's rules. */
export function computeShippingCents(
  subtotalCents: number,
  settings: { flatShippingCents: number; freeShippingThresholdCents: number }
): number {
  if (subtotalCents <= 0) return 0;
  if (
    settings.freeShippingThresholdCents > 0 &&
    subtotalCents >= settings.freeShippingThresholdCents
  ) {
    return 0;
  }
  return settings.flatShippingCents;
}

export function computeTaxCents(taxableCents: number, taxRateBps: number): number {
  if (taxRateBps <= 0) return 0;
  return Math.round((taxableCents * taxRateBps) / 10000);
}
