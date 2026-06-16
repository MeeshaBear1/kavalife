import "server-only";
import { isSquareConfigured } from "./square";

export type CheckoutMode = "reserve" | "square" | "mock";

/**
 * How checkout behaves, controlled by the CHECKOUT_MODE env var:
 *
 *  - "reserve" — record a real order + the customer's contact details, but DON'T
 *    charge. The order lands in Admin → Orders as PENDING; the seller follows up
 *    to collect payment (then clicks "Mark as paid", which deducts stock). This
 *    is the launch mode while there's no kava-friendly card processor connected.
 *
 *  - "square" — real Square hosted payment link (requires SQUARE_* credentials).
 *
 *  - "mock" — dev/demo: the order is marked paid instantly with no real charge.
 *
 *  - "auto" (default) — Square if its credentials are present, otherwise mock.
 *    Keeps local dev + the smoke test working with zero configuration.
 */
export function checkoutMode(): CheckoutMode {
  const m = (process.env.CHECKOUT_MODE || "auto").trim().toLowerCase();
  if (m === "reserve") return "reserve";
  if (m === "mock") return "mock";
  // "square" (forced) and "auto" both need real credentials to charge; without
  // them we fall back to mock so the store never hard-fails at checkout.
  return isSquareConfigured ? "square" : "mock";
}
