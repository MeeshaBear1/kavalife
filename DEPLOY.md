# Deploy Kava Life to your VPS

A turnkey, self-contained production deploy: **app + PostgreSQL + automatic HTTPS**
in one Docker Compose stack. Launches in **reserve-order mode** (orders are taken
without charging; you collect payment manually) — see [`MORNING-HANDOFF.md`](MORNING-HANDOFF.md)
for why, and [`SQUARE_SETUP.md`](SQUARE_SETUP.md) for switching on a card processor later.

---

## What you need

- A VPS (Hetzner, DigitalOcean, Linode, etc.) running Linux, with **Docker** and the
  **Docker Compose plugin** installed.
- A **domain** (or subdomain like `shop.yourdomain.com`).
- The domain's **DNS A record pointed at your server's IP** (AAAA too if you use IPv6).
- Ports **80** and **443** open to the internet (for HTTPS + Let's Encrypt).

> Install Docker on Ubuntu/Debian (one-time):
> ```bash
> curl -fsSL https://get.docker.com | sh
> sudo usermod -aG docker $USER && newgrp docker   # run docker without sudo
> ```

---

## Step-by-step

### 1. Get the code on the server
```bash
# via git:
git clone <your-repo-url> kavalife && cd kavalife
# …or copy the folder up with scp/rsync (the local .env is gitignored and will
#    NOT come along — you create a fresh one in the next step).
```

### 2. Create the production `.env`
```bash
cp .env.production.example .env
nano .env        # fill in every CHANGE_ME value
```
Generate the two secrets it asks for:
```bash
openssl rand -base64 24                                          # POSTGRES_PASSWORD
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # SESSION_SECRET
# (no node on the server? use: openssl rand -hex 48)
```
Set `SITE_DOMAIN` to your bare hostname (e.g. `shop.yourdomain.com`) and
`NEXT_PUBLIC_SITE_URL` to `https://` + that domain. Leave `CHECKOUT_MODE="reserve"`.

### 3. Point DNS
Create an **A record** for `SITE_DOMAIN` → your server's public IP. Verify:
```bash
dig +short shop.yourdomain.com      # should print your server IP
```
Wait until it resolves before the next step (Caddy needs it to issue the cert).

### 4. Launch
```bash
docker compose --profile prod up -d --build
```
This builds the app, starts PostgreSQL, runs the DB migration + seed automatically
on first boot, and starts Caddy — which fetches a TLS certificate for your domain.
First build takes a few minutes. Watch progress:
```bash
docker compose logs -f app caddy
```
When you see the app "Launching Next.js server" and Caddy "certificate obtained",
visit **https://your-domain** 🎉

### 5. Verify it's live
- [ ] `https://your-domain` loads the storefront over HTTPS (valid padlock).
- [ ] `https://your-domain/admin` → log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- [ ] Place a **test order**: add an item → checkout → you should land on a
      "Mahalo for your order!" page that says **you haven't been charged**.
- [ ] In **Admin → Orders** that order shows as **PENDING** with the customer's
      contact details. Cancel it (or delete via the DB) so you start clean.
- [ ] Add real product photos in **Admin → Products** if not already set.

You're live and taking (reserve) orders.

---

## How reserve mode works day-to-day

1. A customer places an order → it appears in **Admin → Orders** as **PENDING** with
   their name, email, phone, and shipping address. **No card was charged.**
2. Open the order. The **Collect payment** panel gives you two ways to take money:
   - **Pay online via Square** *(once Square is connected — see below)*: click
     **Create Square payment link**, then **Copy** it or **Email to customer**. When
     they pay, Square's webhook marks the order **paid** and deducts stock
     automatically (the order page also reconciles the moment they return).
   - **Collected another way** (invoice, Zelle, in-person, etc.): the panel has the
     customer's email + phone; once you've been paid, click **Mark as paid** — this
     deducts stock and records the sale in your inventory ledger.
3. When shipped, click **Mark as fulfilled**.

Stock is **not** held by a pending reserve order, so if two people reserve the last
unit, sort it out when you collect payment. Cancel stale reserves from the order page.

> **This is the key launch posture:** the public storefront stays in `reserve` mode
> (no surprise auto-charges — the volume pattern that gets high-risk accounts frozen),
> while you still process each live order's payment **through Square from the
> dashboard**, on your terms. Connect Square per the next section to light up the
> "Create Square payment link" button.

---

## Operating the stack

```bash
docker compose --profile prod ps              # status
docker compose --profile prod logs -f app     # app logs
docker compose --profile prod restart app     # restart just the app
docker compose --profile prod down            # stop everything (data volumes persist)
```

### Update / redeploy after code changes
```bash
git pull        # or re-copy the files
docker compose --profile prod up -d --build
```
The entrypoint re-runs `prisma db push` (safe, idempotent) and the seed (only fills
gaps) on each boot.

### Back up your data (do this regularly)
Two named volumes hold everything important: `kava_db` (orders, products, inventory)
and `kava_uploads` (product photos).
```bash
# Database dump:
docker compose --profile prod exec db pg_dump -U kava kavalife > backup-$(date +%F).sql
# Uploaded photos:
docker run --rm -v kavalife_kava_uploads:/u -v "$PWD":/out alpine \
  tar czf /out/uploads-$(date +%F).tgz -C /u .
```

---

## Switching on real card payments later

When a kava-friendly processor is approved (a high-risk merchant account, or Square
if they accept your catalog — confirm first, see `SQUARE_SETUP.md`):

1. Put the Square credentials (`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`,
   `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_ENVIRONMENT="production"`) in `.env`.
2. Add the webhook in the Square dashboard pointing at
   `https://your-domain/api/webhooks/square` (subscribe to `payment.*` and
   `refund.*`); copy its signature key into `.env`.
3. `docker compose --profile prod up -d` (no rebuild needed for env-only changes).

Now you have **two modes**, and you can pick per your risk appetite:

- **Keep `CHECKOUT_MODE="reserve"` (recommended for high-risk):** the storefront still
  never auto-charges, but **Admin → Orders → Collect payment → Create Square payment
  link** is now live, so you process each order's payment through Square by hand. Lowest
  account-freeze risk.
- **Set `CHECKOUT_MODE="square"`:** customers are sent straight to a Square hosted
  payment link at checkout and charged immediately. Only do this once you're confident
  Square will sustain your volume.

Either way, test one real order end-to-end before announcing.

The payment layer is isolated to `src/lib/square.ts` + `src/app/api/checkout` +
`src/app/api/webhooks/square`, so adapting it to a different processor's API is a
contained change.

---

## Troubleshooting

- **Caddy won't get a certificate** — DNS isn't pointed yet, or ports 80/443 are
  blocked by a firewall/security group. Confirm `dig +short SITE_DOMAIN` returns your
  IP and both ports are open, then `docker compose --profile prod restart caddy`.
- **502 / app not reachable** — check `docker compose --profile prod logs app`. The
  app waits for Postgres health before starting; give it a minute on first boot.
- **No cert / serving on `localhost`** — `SITE_DOMAIN` isn't set in `.env`, so Caddy
  defaulted to `localhost`. Set it to your real domain and
  `docker compose --profile prod up -d`.
- **Bring your own proxy instead of Caddy** — if your host already provides TLS
  (e.g. a load balancer or Cloudflare), skip the profile: run
  `docker compose up -d --build` (no `--profile prod`) and point your proxy at the
  app, which is published on `127.0.0.1:3000`.
