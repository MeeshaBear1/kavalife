import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your cart is empty."),
  email: z.string().email("A valid email is required."),
  customerName: z.string().trim().min(1).max(120).optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  source: z.string().max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).optional(),
  category: z.enum(["GUMMIES", "SHOTS", "SELTZERS"]),
  flavor: z.string().trim().max(80).optional().nullable(),
  shortDescription: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).optional().nullable(),
  sku: z.string().trim().max(60).optional().nullable(),
  imageUrl: z.string().trim().max(600).optional().nullable(),
  accentColor: z.string().trim().max(20).optional().nullable(),
  lowStockThreshold: z.number().int().min(0).default(12),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  delta: z.number().int(),
  reason: z.enum(["INITIAL", "RESTOCK", "SALE", "ADJUSTMENT", "RETURN"]),
  note: z.string().trim().max(280).optional(),
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  announcement: z.string().trim().max(280).optional().nullable(),
  supportEmail: z.string().email(),
  flatShippingCents: z.number().int().min(0),
  freeShippingThresholdCents: z.number().int().min(0),
  taxRateBps: z.number().int().min(0).max(10000),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
