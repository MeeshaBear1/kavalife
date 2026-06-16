# Square checkout setup — Kava Life

The storefront uses **Square hosted Checkout (payment links)**. With no Square
credentials set, it runs in **mock mode** (orders are created and marked paid
with no real charge) so you can develop and demo with zero accounts. Fill in the
env vars below to take real money.

> ⚠️ **Before you invest time here: confirm Square will accept a kava business.**
> Payment processors classify kava as "high-risk" and Square's Seller Agreement
> prohibits some botanicals (kratom outright). Confirm with Square support / your
> account manager that your catalog is allowed **before** going live. The payment
> layer is isolated to `src/lib/square.ts` + `src/app/api/checkout` +
> `src/app/api/webhooks/square` if you ever need to swap processors.

---

## Environment variables

| Variable | Required | Where to find it |
|---|---|---|
| `SQUARE_ENVIRONMENT` | yes | `sandbox` while testing, `production` to take real money |
| `SQUARE_ACCESS_TOKEN` | yes (real mode) | Square Dashboard → **Developer** → your app → **Credentials** (pick Sandbox or Production to match `SQUARE_ENVIRONMENT`) |
| `SQUARE_LOCATION_ID` | yes (real mode) | Developer → **Locations** (the location you sell from) |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | yes (real mode) | Developer → **Webhooks** → your subscription → **Signature key** |
| `SQUARE_WEBHOOK_URL` | optional | Exact webhook URL if it differs from `${NEXT_PUBLIC_SITE_URL}/api/webhooks/square` (e.g. an ngrok URL during local testing) |
| `SQUARE_API_VERSION` | optional | Override the pinned Square API version (default `2025-01-23`) if Square rejects it |

Leaving `SQUARE_ACCESS_TOKEN` or `SQUARE_LOCATION_ID` blank keeps **mock mode** on.

---

## 1. Test in Sandbox first

1. Create / log into a [Square Developer account](https://developer.squareup.com/).
2. Create an **Application**. Open it → **Credentials** → toggle **Sandbox**.
3. Copy the **Sandbox Access Token** → `SQUARE_ACCESS_TOKEN`.
4. **Locations** → copy the sandbox **Location ID** → `SQUARE_LOCATION_ID`.
5. Set `SQUARE_ENVIRONMENT="sandbox"`.

### Wire up the webhook (so paid orders fulfill automatically)

The webhook is what flips an order to **PAID**, decrements inventory, and handles
refunds. The success page also reconciles on redirect, so a single test works
without it — but you want the webhook for production.

1. Expose your local server publicly (Square must reach it):
   ```bash
   ngrok http 3000
   ```
   Copy the `https://….ngrok-free.app` URL.
2. Square Developer → your app → **Webhooks** → **Add endpoint**:
   - **URL:** `https://<your-ngrok>.ngrok-free.app/api/webhooks/square`
   - **Events:** subscribe to
     `payment.created`, `payment.updated`, `refund.created`, `refund.updated`
3. Copy the endpoint's **Signature key** → `SQUARE_WEBHOOK_SIGNATURE_KEY`.
4. Set `SQUARE_WEBHOOK_URL` to that exact ngrok webhook URL (the signature is
   computed over the URL + body, so it must match precisely). When you deploy to
   your real domain, set `NEXT_PUBLIC_SITE_URL` to the domain and you can drop
   `SQUARE_WEBHOOK_URL` (it defaults to `${NEXT_PUBLIC_SITE_URL}/api/webhooks/square`).
5. Restart `npm run dev` so it picks up the env vars.

### Place a sandbox test order

Add items → checkout → you're redirected to Square's hosted page. Use a
[Square sandbox test card](https://developer.squareup.com/docs/devtools/sandbox/payments)
(e.g. **4111 1111 1111 1111**, any future expiry, any CVV, any ZIP). You should
land on `/checkout/success` marked **paid**, the order should be **PAID** in
Admin → Orders, and stock should drop. Issue a refund from the Square dashboard
to confirm it flips to **REFUNDED** and restocks.

---

## 2. Go live (production)

1. In Square, complete business activation (bank account, identity).
2. Developer → your app → **Credentials** → **Production**: copy the
   **Production Access Token** → `SQUARE_ACCESS_TOKEN`.
3. **Locations** (production) → copy the real **Location ID** → `SQUARE_LOCATION_ID`.
4. Set `SQUARE_ENVIRONMENT="production"`.
5. Add a **production webhook** endpoint at
   `https://YOURDOMAIN/api/webhooks/square` with the same four events, and copy
   its **Signature key** → `SQUARE_WEBHOOK_SIGNATURE_KEY`.
6. Set `NEXT_PUBLIC_SITE_URL="https://YOURDOMAIN"`.
7. Deploy, then place one real (small) order and refund it to confirm the full
   round-trip before announcing the store.

---

## How it works (for future maintainers)

- **`src/app/api/checkout/route.ts`** creates the order **PENDING**, re-derives
  every price from the DB (never trusts the client), computes shipping/tax from
  Admin → Settings, then asks Square for a **payment link** and redirects the
  buyer there. The Square order id is saved on our order as `paymentSessionId`.
- **`src/app/api/webhooks/square/route.ts`** verifies Square's HMAC signature,
  then on `payment.*` (status `COMPLETED`) marks the order **PAID** + decrements
  stock, and on a **full** `refund.*` marks it **REFUNDED** + restocks. Every
  handler is idempotent, so Square retries are safe.
- **`src/app/(store)/checkout/success/page.tsx`** reconciles on return (in case
  the webhook is delayed) by checking the Square payment/order status.
- **`src/lib/square.ts`** is the only file that talks to Square (thin REST
  client + webhook verification). Swap it to change processors.

### Difference from the old Stripe flow
Square payment links don't auto-expire like Stripe Checkout sessions did, so an
abandoned checkout leaves its order **PENDING** (no stock was deducted) instead
of auto-cancelling. Cancel stale pending orders from Admin → Orders, or add a
scheduled job later to expire them.
