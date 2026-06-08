"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { productInputSchema } from "@/lib/validation";
import { adjustStock } from "@/lib/orders";
import { requireAdminAction } from "@/components/admin/require-admin";

export type ProductFormState = { error: string | null; fieldErrors?: Record<string, string> };

// ---- formData helpers ------------------------------------------------------

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function intOr(fd: FormData, key: string, fallback: number): number {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

/** Parse + validate the shared product form into a Prisma-ready data object. */
function parseProductForm(fd: FormData) {
  const priceCents = dollarsToCents(str(fd, "price") ?? "0");
  const compareRaw = str(fd, "compareAt");
  const compareAtCents = compareRaw !== undefined ? dollarsToCents(compareRaw) : null;

  const candidate = {
    name: str(fd, "name") ?? "",
    slug: str(fd, "slug"),
    category: (str(fd, "category") ?? "GUMMIES") as "GUMMIES" | "SHOTS" | "SELTZERS",
    flavor: str(fd, "flavor") ?? null,
    shortDescription: str(fd, "shortDescription") ?? null,
    description: str(fd, "description") ?? null,
    priceCents,
    compareAtCents,
    sku: str(fd, "sku") ?? null,
    imageUrl: str(fd, "imageUrl") ?? null,
    accentColor: str(fd, "accentColor") ?? null,
    lowStockThreshold: intOr(fd, "lowStockThreshold", 12),
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
    sortOrder: intOr(fd, "sortOrder", 0),
  };

  return productInputSchema.safeParse(candidate);
}

/** Build a unique slug, suffixing -2, -3… on collision (ignoring `excludeId`). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "product";
  let candidate = root;
  let n = 1;
  // Bounded loop — practically never iterates more than a couple times.
  while (n < 1000) {
    const clash = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!clash || clash.id === excludeId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

function firstFieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}

// ---- actions ---------------------------------------------------------------

export async function createProduct(
  _prev: ProductFormState,
  fd: FormData
): Promise<ProductFormState> {
  await requireAdminAction();

  const parsed = parseProductForm(fd);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const initialStock = Math.max(0, intOr(fd, "initialStock", 0));
  const slug = await uniqueSlug(data.slug ?? data.name);

  let productId: string;
  try {
    const created = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        category: data.category,
        flavor: data.flavor,
        shortDescription: data.shortDescription,
        description: data.description,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents,
        sku: data.sku,
        imageUrl: data.imageUrl,
        accentColor: data.accentColor,
        lowStockThreshold: data.lowStockThreshold,
        featured: data.featured,
        active: data.active,
        sortOrder: data.sortOrder,
        stock: 0,
      },
    });
    productId = created.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return { error: `That ${target} is already in use.` };
    }
    throw err;
  }

  if (initialStock > 0) {
    await adjustStock({
      productId,
      delta: initialStock,
      reason: "INITIAL",
      note: "Initial stock",
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  fd: FormData
): Promise<ProductFormState> {
  await requireAdminAction();

  const parsed = parseProductForm(fd);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.slug ?? data.name, id);

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        category: data.category,
        flavor: data.flavor,
        shortDescription: data.shortDescription,
        description: data.description,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents,
        sku: data.sku,
        imageUrl: data.imageUrl,
        accentColor: data.accentColor,
        lowStockThreshold: data.lowStockThreshold,
        featured: data.featured,
        active: data.active,
        sortOrder: data.sortOrder,
        // NOTE: stock is intentionally NOT updated here — it is managed only
        // through the inventory screen and order lifecycle.
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return { error: `That ${target} is already in use.` };
    }
    throw err;
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/inventory");
  redirect("/admin/products");
}

export async function deleteProduct(fd: FormData): Promise<void> {
  await requireAdminAction();
  const id = fd.get("id");
  if (typeof id !== "string" || !id) throw new Error("Missing product id");

  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products");
}
