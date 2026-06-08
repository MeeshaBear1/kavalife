# Kava Life — self-hosted storefront

A complete, self-hosted replacement for the Lovable-built kavalifebrand.com: a faithful
marketing site + a real e-commerce store with **Stripe payments**, an **admin panel**, and a
built-in **inventory tracking system**. One Next.js codebase, one Postgres database, one Docker
command to run it anywhere.

> **Built with:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma ·
> PostgreSQL · Stripe.

---

## Quick start (Docker — recommended)

You need Docker + Docker Compose.

```bash
# from the project root
docker compose up --build
```

That's it. Compose will:

1. start PostgreSQL,
2. build the app, sync the schema (`prisma db push`), and **seed the catalog** (12 products with
   opening inventory, a store-settings row, and an admin user),
3. serve the site on **http://localhost:3000**.

- **Storefront:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin
  (default login `admin@kavalife.local` / `changeme123` — **change this**, see below)

Payments run in **mock mode** until you add Stripe keys, so the entire cart → checkout → order →
inventory-decrement flow works immediately with zero external accounts.

### Change the admin password / secrets

Create a `.env` next to `docker-compose.yml` (Compose reads it automatically):

```env
SESSION_SECRET=<48+ random chars>     # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD=<a strong password>
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

The admin user is created on first seed. To change an **existing** admin's password later, update it
from the database, or delete the `AdminUser` row and re-run the seed with the new env values.

---

## Local development (without Docker for the app)

Run just Postgres in Docker and the app on your machine for hot reload:

```bash
# 1. start only the database (exposed on host port 5434)
docker compose up db -d

# 2. install + set up
npm install
cp .env.example .env          # the defaults already point at localhost:5434
npm run db:push               # create tables
npm run db:seed               # seed catalog + admin + settings

# 3. run
npm run dev                   # http://localhost:3000
```

Handy scripts: `npm run db:studio` (Prisma Studio), `npm run db:reset` (wipe + reseed),
`npm run typecheck`, `npm run lint`, `npm run build`.

---

## Enabling real Stripe payments

> 📘 **For the exact, copy-paste walkthrough (test → verify → go live), see
> [STRIPE_SETUP.md](STRIPE_SETUP.md).** Quick version below.

1. Get your keys from the [Stripe dashboard](https://dashboard.stripe.com/apikeys) (use **test
   mode** first).
2. Set in `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Point a webhook at `https://yourdomain.com/api/webhooks/stripe` for the event
   `checkout.session.completed`. For local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Restart. Checkout now redirects to Stripe Checkout; on success the webhook marks the order paid
   and decrements stock. (A success-page fallback also reconciles payment if the webhook is delayed.)

**Note on kava + payment processors:** kava is generally permitted by Stripe (unlike kratom). Confirm
your specific products are acceptable under Stripe's policies before going live; if not, the checkout
layer is isolated in `src/lib/stripe.ts` + `src/app/api/checkout` and can be swapped.

---

## What's included

### Storefront (`src/app/(store)`)
- Pixel-faithful homepage: hero, trust bar, "Pick Your Chill" product grid, audience segments,
  "Why Kava Life?" comparison, Noble vs Tudei, nanotechnology, nootropic, story, "Why everyone's
  switching", "Honoring the Root", and the 15%-off newsletter capture.
- `/shop` (category filter), `/product/[slug]`, `/cart`, `/checkout`, `/checkout/success`.
- Content pages: `/about`, `/why-kava` (with `#sleep`/`#anxiety`/`#focus`/`#alcohol` anchors),
  `/faq`, `/mocktails`.
- Client-side cart (localStorage) + slide-out cart drawer. Prices are **always re-validated
  server-side** at checkout.

### Admin panel (`src/app/admin`) — protected by session auth
- Dashboard (revenue, orders, low-stock alerts), Orders (status workflow: paid → fulfilled →
  cancel/refund), Products (full CRUD, with **product-photo upload**), **Inventory** (stock levels
  + adjustments + movement ledger), Newsletter signups (+ CSV export), Store settings.

### Inventory tracking
Every stock change is written to an append-only `StockMovement` ledger (`INITIAL`, `RESTOCK`,
`SALE`, `ADJUSTMENT`, `RETURN`) with the resulting balance. Sales auto-decrement on payment; cancels
/refunds auto-restock — all transactional and idempotent (`src/lib/orders.ts`).

---

## Project structure

```
prisma/schema.prisma     data model (products, inventory, orders, admin, newsletter, settings)
prisma/seed.ts           catalog + admin + settings seed (idempotent)
src/lib/                 db, auth (JWT cookie), stripe, cart, orders lifecycle, money, validation
src/middleware.ts        protects /admin/*
src/app/(store)/         storefront
src/app/admin/           admin panel
src/app/api/             checkout, stripe webhook, newsletter
src/components/           store + admin + ui components
docker-compose.yml       app + postgres
Dockerfile               production image (runs migrate + seed on boot)
```

---

## Deploying to a VPS

1. Copy the repo to your server (Hetzner / DigitalOcean / etc.) with Docker installed.
2. Create `.env` with production secrets (`SESSION_SECRET`, `ADMIN_*`, `NEXT_PUBLIC_SITE_URL`, and
   Stripe keys).
3. `docker compose up -d --build`.
4. Put a reverse proxy (Caddy/Nginx/Traefik) in front for TLS, forwarding to port 3000.
5. Configure the Stripe webhook to your public `/api/webhooks/stripe` URL.

### Hardening checklist before launch
- [ ] Set a strong `SESSION_SECRET` (≥ 32 chars) and a real `ADMIN_PASSWORD`.
- [ ] Change the Postgres password in `docker-compose.yml` (and the matching `DATABASE_URL`).
- [ ] Switch Stripe to live keys + live webhook.
- [ ] (Optional) Self-host the fonts — they currently load from Google Fonts via `<link>` in
      `src/app/layout.tsx` to keep offline builds working; vendor the woff2 files for full
      independence.
- [ ] Add real product photos via the admin (Products → **Upload photo**, or paste a URL).

---

## Disclaimer
These statements have not been evaluated by the FDA. This product is not intended to diagnose,
treat, cure, or prevent any disease.
