// End-to-end smoke test for RESERVE checkout mode (CHECKOUT_MODE=reserve).
//
//   npm run db:dev                                  # terminal 1
//   CHECKOUT_MODE=reserve npm run dev               # terminal 2
//   node scripts/smoke-reserve.mjs
//
// Asserts a reserve checkout records a PENDING order WITHOUT charging or
// touching stock (the seller collects payment manually later), then restores
// the database to pristine.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envText = readFileSync(join(__dirname, "..", ".env"), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

let failures = 0;
const ok = (m) => console.log("  ✓ " + m);
const fail = (m) => {
  failures++;
  console.error("  ✗ " + m);
};

try {
  const product = await prisma.product.findFirst({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  if (!product) throw new Error("No active product to test with — seed the DB first.");
  const QTY = 2;
  const before = product.stock;
  console.log(`\nProduct under test: ${product.name} (stock ${before})\n`);

  // 1. Place a reserve checkout.
  const res = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: product.id, quantity: QTY }],
      email: "reserve-test@kavalife.local",
      phone: "(555) 010-2030",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 200) fail(`checkout returned HTTP ${res.status}: ${JSON.stringify(body)}`);
  else if (!body.reserved || !body.url) fail(`expected reserved checkout, got ${JSON.stringify(body)}`);
  else if (!body.url.includes("reserved=1")) fail(`success url missing reserved=1: ${body.url}`);
  else ok("reserve checkout created (no charge)");

  const orderNum = body.url ? new URL(body.url).searchParams.get("order") : null;
  if (!orderNum) fail("no order number in success url");

  // 2. Success page shows the "not charged" reserve messaging.
  if (body.url) {
    const sp = await fetch(body.url);
    const html = await sp.text();
    if (sp.status !== 200) fail(`success page HTTP ${sp.status}`);
    else if (!html.includes(orderNum)) fail("success page missing order number");
    else if (!/haven.{0,3}t been charged/i.test(html)) fail("success page missing 'not charged' reserve copy");
    else ok("success page shows reserve (not charged) confirmation");
  }

  // 3. DB side effects: order PENDING, NOT paid, stock untouched, no SALE ledger.
  const order = orderNum
    ? await prisma.order.findUnique({ where: { orderNumber: orderNum }, include: { items: true } })
    : null;
  if (!order) fail("order not found in DB");
  else {
    order.status === "PENDING" ? ok("order recorded as PENDING (awaiting manual payment)") : fail(`order status ${order.status} (expected PENDING)`);
    order.paidAt === null ? ok("order not marked paid (paidAt null)") : fail("paidAt should be null for a reserve order");
    order.email === "reserve-test@kavalife.local" ? ok("customer contact captured") : fail("customer email not captured");
  }
  const after = await prisma.product.findUnique({ where: { id: product.id } });
  after?.stock === before
    ? ok(`inventory untouched (still ${after.stock} — reserved orders don't hold stock)`)
    : fail(`stock changed to ${after?.stock} (expected unchanged ${before})`);
  const movement = order
    ? await prisma.stockMovement.findFirst({ where: { orderId: order.id } })
    : null;
  movement ? fail(`unexpected stock movement written (reason ${movement.reason})`) : ok("no stock movement written");

  // 4. Restore pristine state.
  if (order) {
    await prisma.stockMovement.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    ok("cleaned up test order");
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅\n" : `\n${failures} CHECK(S) FAILED ❌\n`);
} catch (e) {
  console.error("\nSmoke test error:", e);
  failures++;
} finally {
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}
