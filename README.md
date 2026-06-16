# Kava Life — self-hosted storefront

A complete, self-hosted replacement for the Lovable-built kavalifebrand.com: a faithful
marketing site + a real e-commerce store with **Square payments**, an **admin panel**, and a
built-in **inventory tracking system**. One Next.js codebase, one Postgres database, one Docker
command to run it anywhere.

> **Built with:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma ·
> PostgreSQL · Square.

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

Payments run in **mock mode** until you add Square credentials, so the entire cart → checkout → order →
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

## Local development

### Option A — no Docker at all (recommended for quick local work)

`npm run db:dev` starts a real PostgreSQL (PGlite, a WASM build of Postgres — no
Docker, no system install) on `localhost:5434`, exactly where `.env.example`
points. Data persists in `./.pglite`.

```bash
npm install
cp .env.example .env           # defaults already point at localhost:5434

# terminal 1 — leave this running:
npm run db:dev

# terminal 2:
npm run db:push                # create tables
npm run db:seed                # seed catalog + admin + settings
npm run dev                    # http://localhost:3000
```

> The dev `DATABASE_URL` carries `?sslmode=disable&pgbouncer=true&connection_limit=1`
> for PGlite. A normal managed Postgres (production) needs none of those — just a
> plain `postgresql://…` URL. See `.env` comments.

### Option B — Postgres in Docker, app on your machine

```bash
docker compose up db -d        # database only, on host port 5434
npm install
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

Handy scripts: `npm run db:studio` (Prisma Studio), `npm run db:reset` (wipe + reseed),
`npm run typecheck`, `npm run lint`, `npm run build`.

---

## Enabling real Square payments

> 📘 **For the exact, copy-paste walkthrough (sandbox → verify → go live), see
> [SQUARE_SETUP.md](SQUARE_SETUP.md).** Quick version below.

1. Get your credentials from the [Square Developer dashboard](https://developer.squareup.com/apps)
   (use the **Sandbox** environment first).
2. Set in `.env`:
   ```env
   SQUARE_ENVIRONMENT=sandbox
   SQUARE_ACCESS_TOKEN=...        # Developer → your app → Credentials
   SQUARE_LOCATION_ID=...         # Developer → Locations
   SQUARE_WEBHOOK_SIGNATURE_KEY=...   # Developer → Webhooks → Signature key
   ```
3. Add a webhook endpoint at `https://yourdomain.com/api/webhooks/square` subscribed to
   `payment.created`, `payment.updated`, `refund.created`, `refund.updated`. For local testing,
   expose your server with `ngrok http 3000` and use the ngrok URL (set `SQUARE_WEBHOOK_URL` to it).
4. Restart. Checkout now redirects to a Square hosted payment link; on success the webhook marks the
   order paid and decrements stock. (A success-page fallback also reconciles payment if the webhook
   is delayed.)

**Note on kava + payment processors:** payment processors classify kava as "high-risk." Confirm with
Square that your specific catalog is acceptable **before** going live (kratom is prohibited; kava is
gray-area). The checkout layer is isolated in `src/lib/square.ts` + `src/app/api/checkout` +
`src/app/api/webhooks/square` and can be swapped for another processor.

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
src/lib/                 db, auth (JWT cookie), square, cart, orders lifecycle, money, validation
src/middleware.ts        protects /admin/*
src/app/(store)/         storefront
src/app/admin/           admin panel
src/app/api/             checkout, square webhook, newsletter
src/components/           store + admin + ui components
docker-compose.yml       app + postgres
Dockerfile               production image (runs migrate + seed on boot)
```

---

## Deploying to a VPS

📘 **Full turnkey runbook: [DEPLOY.md](DEPLOY.md)** — app + PostgreSQL + automatic
HTTPS in one Compose stack. The short version:

1. Copy the repo to your server (Hetzner / DigitalOcean / etc.) with Docker installed.
2. `cp .env.production.example .env` and fill in the values (domain, generated secrets,
   `CHECKOUT_MODE`). Point your domain's DNS A record at the server.
3. `docker compose --profile prod up -d --build` — builds the app, runs the DB
   migrate + seed on first boot, and starts **Caddy**, which fetches a TLS cert for
   your domain automatically.

The store launches in **reserve-order mode** (`CHECKOUT_MODE=reserve`): orders are
taken without charging and you collect payment manually from Admin → Orders — the
practical way to go live before a kava-friendly card processor is approved (mainstream
processors classify kava as high-risk). See [DEPLOY.md](DEPLOY.md) and
[SQUARE_SETUP.md](SQUARE_SETUP.md).

### Hardening checklist before launch
- [ ] Set a strong `SESSION_SECRET` (≥ 32 chars) and a real `ADMIN_PASSWORD`.
- [ ] Set a strong `POSTGRES_PASSWORD` in `.env` (compose injects it into both the DB and `DATABASE_URL`).
- [ ] Confirm a payment plan: launch in `reserve` mode, then switch to `square`/other once a processor approves your catalog.
- [ ] (Optional) Self-host the fonts — they currently load from Google Fonts via `<link>` in
      `src/app/layout.tsx` to keep offline builds working; vendor the woff2 files for full
      independence.
- [ ] Add real product photos via the admin (Products → **Upload photo**, or paste a URL).

---

## Disclaimer
These statements have not been evaluated by the FDA. This product is not intended to diagnose,
treat, cure, or prevent any disease.
