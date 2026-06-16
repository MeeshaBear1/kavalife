// End-to-end smoke test for the (mock-mode) checkout flow.
//
//   npm run dev     # in another terminal (with npm run db:dev running too)
//   node scripts/smoke-checkout.mjs
//
// Drives a real checkout through the running app and asserts the DB side
// effects (order PAID, stock decremented, SALE ledger written), then restores
// the database to its original state so it stays pristine.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env (DATABASE_URL, NEXT_PUBLIC_SITE_URL) from .env for a bare node run.
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

  // 1. Place a mock checkout.
  const res = await fetch(`${BASE}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ productId: product.id, quantity: QTY }],
      email: "smoke-test@kavalife.local",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 200) fail(`checkout returned HTTP ${res.status}: ${JSON.stringify(body)}`);
  else if (!body.mock || !body.url) fail(`expected mock checkout url, got ${JSON.stringify(body)}`);
  else ok("mock checkout created (no Square keys → mock mode)");

  const orderNum = body.url ? new URL(body.url).searchParams.get("order") : null;
  if (!orderNum) fail("no order number in success url");

  // 2. Success page renders the order.
  if (body.url) {
    const sp = await fetch(body.url);
    const html = await sp.text();
    if (sp.status !== 200) fail(`success page HTTP ${sp.status}`);
    else if (!html.includes(orderNum)) fail("success page missing order number");
    else ok("success page renders the confirmed order");
  }

  // 3. DB side effects.
  const order = orderNum
    ? await prisma.order.findUnique({ where: { orderNumber: orderNum }, include: { items: true } })
    : null;
  if (!order) fail("order not found in DB");
  else {
    order.status === "PAID" ? ok("order marked PAID") : fail(`order status ${order.status} (expected PAID)`);
    order.paidAt ? ok("paidAt timestamp set") : fail("paidAt not set");
  }
  const after = await prisma.product.findUnique({ where: { id: product.id } });
  after?.stock === before - QTY
    ? ok(`inventory decremented ${before} → ${after.stock}`)
    : fail(`stock is ${after?.stock} (expected ${before - QTY})`);
  const movement = order
    ? await prisma.stockMovement.findFirst({ where: { orderId: order.id, reason: "SALE" } })
    : null;
  movement ? ok(`SALE ledger movement written (delta ${movement.delta})`) : fail("no SALE stock movement");

  // 4. Restore pristine state.
  if (order) {
    await prisma.stockMovement.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  }
  await prisma.product.update({ where: { id: product.id }, data: { stock: before } });
  ok("cleaned up test order + restored inventory");

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✅\n" : `\n${failures} CHECK(S) FAILED ❌\n`);
} catch (e) {
  console.error("\nSmoke test error:", e);
  failures++;
} finally {
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}
