# ☀️ Handoff — Kava Life storefront (Square)

**Updated:** 2026-06-13 · **Status: ✅ runs end-to-end; ready to deploy in reserve mode.**

> **To go live today: follow [`DEPLOY.md`](DEPLOY.md)** — a turnkey VPS deploy (app +
> PostgreSQL + automatic HTTPS) that launches in **reserve-order mode**.

**The kava payment reality:** mainstream processors (Square, Stripe, PayPal) classify
kava as high-risk and generally won't sustainably process it — accounts get declined
or, worse, approved then frozen with your money in them. So the store launches in
**reserve mode**: customers place real orders with their contact details, **nothing is
charged**, and you collect payment manually from Admin → Orders. This gets you genuinely
live today with zero account-freeze risk. When a kava-friendly processor is approved you
flip one env var to start charging. The Square integration is built and isolated
(switched from Stripe on 2026-06-13) for if/when you can use it.

---

## TL;DR — see it running locally

Two terminals, no Docker needed:

```bash
npm run db:dev          # terminal 1 — local Postgres (PGlite/WASM), leave running
npm run dev             # terminal 2 — the app
```

- Storefront → http://localhost:3000
- Admin → http://localhost:3000/admin · `admin@kavalife.local` / `changeme123`
- Checkout works immediately in **mock mode**. Smoke test: `node scripts/smoke-checkout.mjs`.

When you're ready for real payments, follow [`SQUARE_SETUP.md`](SQUARE_SETUP.md)
(sandbox → verify → production). Short version under "Go live" below.

---

## Payment layer (Square)

Order is created **PENDING** → buyer is redirected to a Square **hosted payment link** →
Square's **webhook** marks it PAID and decrements inventory (idempotent) → the success
page reconciles if the webhook is slow. Prices are always re-derived from the DB
(never trusted from the client); shipping/tax come from Admin → Settings and are passed
to Square as line items so the charged total always equals the order total.

Everything that talks to Square is isolated to four files (swap them to change processors):

```
src/lib/square.ts                     thin Square REST client + webhook HMAC verification
src/lib/order-payment.ts              builds a Square payment link from a saved order
                                      (one source of truth for checkout + admin)
src/app/api/checkout/route.ts         creates the order, then the Square payment link
src/app/api/webhooks/square/route.ts  payment.* → PAID + decrement; refund.* → REFUNDED + restock
```

**Process a live order's payment through Square from the dashboard:** open any
PENDING order → **Collect payment** panel → **Create Square payment link**, then
**Copy** / **Email to customer**. When they pay, the webhook marks it paid + deducts
stock. This works even while the storefront stays in `reserve` mode (the safe
high-risk posture), so you can take Square payments per-order without flipping the
whole store to auto-charge. The button only appears once Square credentials are set.

Order payment fields are processor-agnostic: `paymentSessionId` = Square **order** id,
`paymentRef` = Square **payment** id.

**Checkout mode** is set by the `CHECKOUT_MODE` env var (`src/lib/checkout-mode.ts`):
- `reserve` — record the order + contact info, **don't charge** (the launch mode; set in
  the production `.env`). The order is PENDING; you either send a Square payment link
  from the order's **Collect payment** panel (once Square is connected), or take payment
  another way and click **Mark as paid** in the admin — both deduct stock.
- `auto` (default) — real Square if credentials are set, else `mock`.
- `mock` — mark orders paid instantly, no charge (dev/demo + the smoke tests).
- `square` — force real Square (needs credentials).

> **Difference from the old Stripe flow:** Square payment links don't auto-expire, so an
> abandoned checkout leaves its order **PENDING** (no stock deducted) instead of
> auto-cancelling. Cancel stale pending orders from Admin → Orders.

---

## 🚀 Go-live checklist

### 1. Launch in reserve mode (today) — [`DEPLOY.md`](DEPLOY.md)
The bundled stack (app + Postgres + automatic HTTPS via Caddy) is ready. On your VPS:
- [ ] Get the code on the server; install Docker.
- [ ] `cp .env.production.example .env` and fill it in:
  - `SITE_DOMAIN` + `NEXT_PUBLIC_SITE_URL` (your domain), `CHECKOUT_MODE="reserve"`.
  - Strong `SESSION_SECRET`, `POSTGRES_PASSWORD`, real `ADMIN_EMAIL`/`ADMIN_PASSWORD`
    (defaults `admin@kavalife.local` / `changeme123` — change them).
- [ ] Point the domain's DNS **A record** at the server.
- [ ] `docker compose --profile prod up -d --build` (migrate + seed run automatically;
      Caddy fetches the TLS cert).
- [ ] Verify: HTTPS storefront loads, admin login works, a test order lands in
      Admin → Orders as **PENDING / not charged**.

Database: the bundled Postgres service (persistent `kava_db` volume) — nothing else to
provision. Back up `kava_db` + `kava_uploads` regularly (commands in DEPLOY.md).

### 2. Run orders (reserve mode)
Orders arrive **PENDING** with full contact details. From the order's **Collect
payment** panel either send a **Square payment link** (auto-marks paid on payment) or
collect another way and click **Mark as paid** (deducts stock) → **Mark as fulfilled**
when shipped. See DEPLOY.md → "How reserve mode works day-to-day".

### 3. Later — switch on a real card processor
- [ ] Get approved by a **kava-friendly high-risk merchant account** (PayKings,
      QuadraPay, etc. — a few days of underwriting), **or** confirm directly with Square
      that they'll accept your specific catalog (don't assume — see the payment reality
      note above; full Square steps in [`SQUARE_SETUP.md`](SQUARE_SETUP.md)).
- [ ] Put the credentials in `.env`, set `CHECKOUT_MODE="square"` (or adapt
      `src/lib/square.ts` to the processor's API), redeploy, and test one real order.

---

## Notes / caveats
- **Mock mode is safe to demo** — no Square account needed; orders are marked paid locally.
- **The local `.env`** is gitignored (dev-only values + a generated `SESSION_SECRET`,
  blank Square creds). It is not committed or deployed.
- **One lint warning** (`no-page-custom-font` in `layout.tsx`) is pre-existing and
  intentional — fonts load from Google Fonts via `<link>` so offline builds work. The
  README's hardening checklist notes you can self-host the woff2 files later.
- The unused `stripe` npm package is still in `package.json` (harmless); remove it on a
  cleanup pass if you like (`npm uninstall stripe`).

— 🌺
