import { PrismaClient, Category, StockReason } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SeedProduct = {
  name: string;
  category: Category;
  flavor: string;
  priceCents: number;
  accentColor: string;
  shortDescription: string;
  description: string;
  stock: number;
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
};

const DEFAULT_DESC =
  "Crafted with premium Noble Kava and our patented nano-extraction for a smooth, clean calm — zero alcohol, zero hangover. These statements have not been evaluated by the FDA.";

const PRODUCTS: SeedProduct[] = [
  // ---- GUMMIES ($17.99) ----
  {
    name: "Kava Gummies — Dragon Fruit Lychee",
    category: "GUMMIES",
    flavor: "Dragon Fruit Lychee",
    priceCents: 1799,
    accentColor: "#e3548b",
    shortDescription: "Tropical chew for easy, social calm.",
    description: DEFAULT_DESC,
    stock: 140,
    featured: true,
    rating: 4.9,
    reviewCount: 212,
  },
  {
    name: "Kava Gummies — Lemon Ginger",
    category: "GUMMIES",
    flavor: "Lemon Ginger",
    priceCents: 1799,
    accentColor: "#ffcd4d",
    shortDescription: "Bright citrus with a warming ginger finish.",
    description: DEFAULT_DESC,
    stock: 120,
    rating: 4.8,
    reviewCount: 168,
  },
  {
    name: "Kava Gummies — Pineapple Coconut",
    category: "GUMMIES",
    flavor: "Pineapple Coconut",
    priceCents: 1799,
    accentColor: "#f5b301",
    shortDescription: "Beach-day vibes in a bite.",
    description: DEFAULT_DESC,
    stock: 132,
    rating: 4.9,
    reviewCount: 190,
  },
  // ---- SHOTS ($5.49) ----
  {
    name: "Kava Shot — Ginger Lime",
    category: "SHOTS",
    flavor: "Ginger Lime",
    priceCents: 549,
    accentColor: "#1fa85c",
    shortDescription: "Fast-acting 2oz reset. Down it and unwind.",
    description: DEFAULT_DESC,
    stock: 240,
    featured: true,
    rating: 4.8,
    reviewCount: 143,
  },
  {
    name: "Kava Shot — Pineapple Coconut",
    category: "SHOTS",
    flavor: "Pineapple Coconut",
    priceCents: 549,
    accentColor: "#f5b301",
    shortDescription: "A tropical 2oz pick-me-calm.",
    description: DEFAULT_DESC,
    stock: 228,
    rating: 4.7,
    reviewCount: 119,
  },
  // ---- SELTZERS ($6.49) ----
  {
    name: "Kava Seltzer — Mixed Berry",
    category: "SELTZERS",
    flavor: "Mixed Berry",
    priceCents: 649,
    accentColor: "#b5468f",
    shortDescription: "Crisp, bubbly, and ridiculously easy to love.",
    description: DEFAULT_DESC,
    stock: 300,
    featured: true,
    rating: 4.9,
    reviewCount: 264,
  },
  {
    name: "Kava Seltzer — Lemon Lime",
    category: "SELTZERS",
    flavor: "Lemon Lime",
    priceCents: 649,
    accentColor: "#8bc34a",
    shortDescription: "Zesty, clean, and endlessly sippable.",
    description: DEFAULT_DESC,
    stock: 286,
    rating: 4.8,
    reviewCount: 201,
  },
  {
    name: "Kava Seltzer — Pineapple Coconut",
    category: "SELTZERS",
    flavor: "Pineapple Coconut",
    priceCents: 649,
    accentColor: "#f5b301",
    shortDescription: "Piña-vibes without the hangover.",
    description: DEFAULT_DESC,
    stock: 274,
    rating: 4.9,
    reviewCount: 233,
  },
  {
    name: "Kava Seltzer — Dragon Fruit Lychee",
    category: "SELTZERS",
    flavor: "Dragon Fruit Lychee",
    priceCents: 649,
    accentColor: "#e3548b",
    shortDescription: "Exotic, floral, and seriously refreshing.",
    description: DEFAULT_DESC,
    stock: 268,
    rating: 4.8,
    reviewCount: 188,
  },
  {
    name: "Kava Seltzer — Mango Orange",
    category: "SELTZERS",
    flavor: "Mango Orange",
    priceCents: 649,
    accentColor: "#f97316",
    shortDescription: "Sunset in a can.",
    description: DEFAULT_DESC,
    stock: 252,
    rating: 4.7,
    reviewCount: 156,
  },
  {
    name: "Kava Seltzer — Strawberry Kiwi",
    category: "SELTZERS",
    flavor: "Strawberry Kiwi",
    priceCents: 649,
    accentColor: "#f2615c",
    shortDescription: "Sweet-tart and made for the porch.",
    description: DEFAULT_DESC,
    stock: 240,
    rating: 4.8,
    reviewCount: 174,
  },
  {
    name: "Kava Seltzer — Ginger Lime",
    category: "SELTZERS",
    flavor: "Ginger Lime",
    priceCents: 649,
    accentColor: "#14b8a6",
    shortDescription: "Spicy-citrus sparkle with a calm core.",
    description: DEFAULT_DESC,
    stock: 236,
    rating: 4.9,
    reviewCount: 197,
  },
];

function skuFor(p: SeedProduct, index: number): string {
  const cat = p.category.slice(0, 3);
  const fl = p.flavor
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return `KL-${cat}-${fl}-${String(index + 1).padStart(2, "0")}`;
}

async function main() {
  console.log("Seeding Kava Life...");

  // 1) Store settings (single row, id = 1)
  await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log("  ✓ store settings ready");

  // 2) Bootstrap admin
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@kavalife.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: { email: adminEmail, name: "Store Admin", passwordHash },
    });
    console.log(`  ✓ admin created: ${adminEmail}`);
  } else {
    console.log(`  • admin already exists: ${adminEmail}`);
  }

  // 3) Products (only when catalog is empty)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    let sortOrder = 0;
    for (const [index, p] of PRODUCTS.entries()) {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          slug: slugify(p.name),
          category: p.category,
          flavor: p.flavor,
          shortDescription: p.shortDescription,
          description: p.description,
          priceCents: p.priceCents,
          sku: skuFor(p, index),
          accentColor: p.accentColor,
          rating: p.rating ?? 5,
          reviewCount: p.reviewCount ?? 0,
          stock: p.stock,
          featured: p.featured ?? false,
          active: true,
          sortOrder: sortOrder++,
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          delta: p.stock,
          balance: p.stock,
          reason: StockReason.INITIAL,
          note: "Initial seed inventory",
        },
      });
    }
    console.log(`  ✓ seeded ${PRODUCTS.length} products with opening inventory`);
  } else {
    console.log(`  • products already present (${productCount}); skipping catalog seed`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
