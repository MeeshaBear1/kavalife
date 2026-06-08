"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Clears the cart once on mount (used on the order-confirmation page). */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
