# Deploying Kava Life to Vercel

This deploys the storefront + admin + inventory system to Vercel, backed by
**Vercel Postgres** (database), **Vercel Blob** (product photos), and
**Square** (payments, with Stripe as a fallback). Domain: **www.kavalife.co**.

> The code is already Vercel-ready. The steps below are the account-side actions
> that require your Vercel login (they can't be automated from a dev machine).
> Wherever possible, set secrets directly in the Vercel dashboard so they never
> land in a chat log or the repo.

---

## How payments are wired

Processor priority is automatic, based on which keys are present:

1. **Square** — used when `SQUARE_ACCESS_TOKEN` + `SQUARE_LOCATION_ID` are set (primary).
2. **Stripe** — used when only the Stripe keys are set (fallback).
3. **mock** — neither set: orders are marked paid *without a charge*.

**Mock mode is blocked in production** (`NODE_ENV=production`) unless you set
`ALLOW_MOCK_CHECKOUT=1`. So a live deploy with no payment keys will *refuse*
checkout rather than give away product. Configure Square (or Stripe) before launch.

The flow is identical for both processors: a `PENDING` order is created in
Postgres → buyer is redirected to the processor's hosted checkout → a webhook
(or a success-page fallback) marks the order `PAID`, which decrements inventory
through the append-only stock ledger. Orders always land in *your* database.

---

## 1. Create the Vercel project

1. Vercel dashboard → **Add New… → Project** → import `MeeshaBear1/kavalife`
   (team **nile-hs-projects**).
2. Framework preset: **Next.js** (auto-detected). Leave the build command at the
   default — Vercel automatically runs the **`vercel-build`** script in
   `package.json`, which does `prisma generate → prisma db push → seed → next build`.
   *(If a build ever skips that, set Build Command to `npm run vercel-build` in
   Project Settings → General.)*
3. Don't deploy yet — add storage and env first (below), or the first build will
   fail with no `DATABASE_URL`. (A failed first build is harmless; just redeploy
   after adding them.)

## 2. Add the database (Vercel Postgres)

1. Project → **Storage → Create Database → Postgres** → create.
2. Connect it to the project. Vercel injects several connection env vars,
   including `POSTGRES_PRISMA_URL` (pooled) and `POSTGRES_URL_NON_POOLING` (direct).
3. Add these two **mapping** env vars (Settings → Environment Variables) so Prisma
   uses the right ones:

   | Name           | Value                          |
   | -------------- | ------------------------------ |
   | `DATABASE_URL` | `$POSTGRES_PRISMA_URL`         |
   | `DIRECT_URL`   | `$POSTGRES_URL_NON_POOLING`   |

   (In the Vercel UI you can reference another variable with the `$NAME` syntax,
   or just paste the actual connection strings from the Storage tab.)

## 3. Add photo storage (Vercel Blob)

1. Project → **Storage → Create Store → Blob** → create, connect to the project.
2. This injects `BLOB_READ_WRITE_TOKEN`. With it set, admin photo uploads go to
   Blob automatically. Without it, uploads would write to Vercel's ephemeral disk
   and vanish on redeploy — so this store is required for working uploads.
   (Existing seeded product photos are bundled in `public/products/`, so the
   catalog renders fine regardless.)

## 4. Set environment variables

Settings → **Environment Variables** (Production). The database/blob vars above
are already set; add:

| Name                            | Value / notes                                                        |
| ------------------------------- | -------------------------------------------------------------------- |
| `SESSION_SECRET`                | 48+ random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL`                   | your admin login email                                               |
| `ADMIN_PASSWORD`                | a strong password (used only to bootstrap the admin on first seed)   |
| `NEXT_PUBLIC_SITE_URL`          | `https://www.kavalife.co`                                            |
| `SQUARE_ACCESS_TOKEN`           | Square **production** access token                                   |
| `SQUARE_LOCATION_ID`            | your Square location id                                              |
| `SQUARE_ENV`                    | `production` (or `sandbox` to test with sandbox creds)               |
| `SQUARE_WEBHOOK_SIGNATURE_KEY`  | from the webhook subscription you create in step 7                   |

Optional Stripe fallback (only used if Square is *not* set): `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## 5. Deploy

Trigger a deploy (push to `main`, or **Redeploy** in the dashboard). The
`vercel-build` script creates the schema and seeds the catalog + admin on the
first run; the seed is idempotent, so later deploys won't duplicate data, reset
stock, or change the admin password.

## 6. Attach the domain

Project → **Settings → Domains** → add **`www.kavalife.co`** (and `kavalife.co`,
set to redirect to `www`). Since the domain is already in your Vercel account,
this is a couple of clicks; Vercel provisions TLS automatically. Make sure
`NEXT_PUBLIC_SITE_URL` matches the primary domain.

## 7. Configure the Square webhook

1. Square Developer dashboard → your app → **Webhooks → Subscriptions → Add**.
2. **Notification URL:** `https://www.kavalife.co/api/webhooks/square`
3. **Events:** `payment.updated` (and `payment.created`).
4. Copy the **Signature Key** → set it as `SQUARE_WEBHOOK_SIGNATURE_KEY` in Vercel
   → redeploy so the value is picked up.

   (The signature is verified against the exact notification URL. If you ever use
   a different URL, set `SQUARE_WEBHOOK_URL` to match.)

## 8. Verify

1. Visit `https://www.kavalife.co` — storefront loads, products render.
2. Place a real test order → you're redirected to Square's hosted checkout → pay →
   you land back on the success page and the order shows in **/admin/orders** as
   **PAID**, with inventory decremented in **/admin/inventory**.
3. Log into `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Notes & cautions

- **Square + kava:** confirm your specific SKUs are permitted under Square's
  seller policies before relying on it — Square has historically been stricter
  about botanicals/supplements than Stripe. Stripe is wired as a drop-in fallback
  if needed.
- **Secrets:** set them in the Vercel dashboard, not in chat or the repo. Rotate
  anything that has been exposed.
- **`vercel-build` runs `prisma db push`** (not migrations). It's additive-safe
  and aborts rather than dropping data; for a structural change that needs data
  migration, run it deliberately rather than relying on auto-deploy.
- **Docker path still works** unchanged (`docker compose up`) for local/VPS use —
  this guide only adds the Vercel path.
