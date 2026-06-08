import { PrismaClient, Category, StockReason } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

type CatalogProduct = {
  name: string;
  slug: string;
  category: Category;
  flavor: string | null;
  priceCents: number;
  sku: string | null;
  imageUrl: string | null;
  accentColor: string | null;
  shortDescription: string;
  description: string;
  sortOrder: number;
  featured: boolean;
  rating: number;
  reviewCount: number;
  stock: number;
  lowStockThreshold: number;
};

// Real Kava Life catalog, migrated from the live Shopify store
// (lovable-project-pzrlt.myshopify.com). Photos live in public/products/.
const catalog = JSON.parse(
  readFileSync(new URL("./catalog.json", import.meta.url), "utf8")
) as CatalogProduct[];

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

  // 3) Products (only when the catalog is empty)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    for (const p of catalog) {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          category: p.category,
          flavor: p.flavor,
          shortDescription: p.shortDescription,
          description: p.description,
          priceCents: p.priceCents,
          sku: p.sku,
          imageUrl: p.imageUrl,
          accentColor: p.accentColor,
          rating: p.rating,
          reviewCount: p.reviewCount,
          stock: p.stock,
          lowStockThreshold: p.lowStockThreshold,
          featured: p.featured,
          active: true,
          sortOrder: p.sortOrder,
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          delta: p.stock,
          balance: p.stock,
          reason: StockReason.INITIAL,
          note: "Opening inventory (migrated from Shopify catalog)",
        },
      });
    }
    console.log(`  ✓ seeded ${catalog.length} products with opening inventory`);
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
