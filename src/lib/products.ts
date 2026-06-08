import { Category, Prisma } from "@prisma/client";
import { prisma } from "./db";

export const CATEGORY_LABELS: Record<Category, string> = {
  GUMMIES: "Gummies",
  SHOTS: "Shots",
  SELTZERS: "Seltzers",
};

export const CATEGORY_ORDER: Category[] = ["GUMMIES", "SHOTS", "SELTZERS"];

export function getActiveProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export function getProductsByCategory(category: Category) {
  return prisma.product.findMany({
    where: { active: true, category },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({ where: { slug, active: true } });
}

export function getFeaturedProducts(take = 4) {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: [{ sortOrder: "asc" }],
    take,
  });
}

export type ProductRecord = Prisma.ProductGetPayload<{}>;

/** Group active products by category for the storefront grid. */
export async function getProductsGroupedByCategory() {
  const products = await getActiveProducts();
  const grouped = new Map<Category, ProductRecord[]>();
  for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
  for (const p of products) {
    grouped.get(p.category)?.push(p);
  }
  return grouped;
}

export function isLowStock(p: { stock: number; lowStockThreshold: number }) {
  return p.stock <= p.lowStockThreshold;
}
