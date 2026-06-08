import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderNumber(): string {
  let rand = "";
  for (let i = 0; i < 5; i++) {
    rand += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)];
  }
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `KL-${stamp}-${rand}`;
}

export function generateDiscountCode(prefix = "ALOHA"): string {
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)];
  }
  return `${prefix}15-${rand}`;
}
