import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe client. Null when STRIPE_SECRET_KEY is not set — in that case the
 * store runs in MOCK CHECKOUT mode (orders are created and marked paid
 * without a real charge), so the full flow works locally with zero keys.
 */
export const stripe: Stripe | null = key
  ? new Stripe(key, { appInfo: { name: "Kava Life" } })
  : null;

export const isStripeConfigured = Boolean(key);
