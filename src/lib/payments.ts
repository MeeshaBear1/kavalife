import "server-only";
import { isSquareConfigured } from "./square";
import { isStripeConfigured } from "./stripe";

export type Processor = "square" | "stripe" | "mock";

/**
 * Which payment processor is active, in priority order:
 *   1. Square  — primary (when SQUARE_ACCESS_TOKEN + SQUARE_LOCATION_ID are set)
 *   2. Stripe  — fallback (when STRIPE_SECRET_KEY is set)
 *   3. mock    — neither configured; orders are marked paid WITHOUT a charge.
 *
 * Mock mode is for local dev & demos only. The guard below blocks it in prod.
 */
export function activeProcessor(): Processor {
  if (isSquareConfigured) return "square";
  if (isStripeConfigured) return "stripe";
  return "mock";
}

/**
 * In production, refuse to fall back to mock checkout — that would hand out
 * product for free. A real processor must be configured, unless the operator
 * has explicitly opted into mock mode with ALLOW_MOCK_CHECKOUT=1 (e.g. a
 * staging deploy that isn't taking real money yet).
 */
export function mockCheckoutBlocked(): boolean {
  return (
    activeProcessor() === "mock" &&
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_MOCK_CHECKOUT !== "1"
  );
}
