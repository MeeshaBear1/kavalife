# Stripe setup — from mock mode to live payments

Kava Life ships with a **mock checkout** so the store works with zero Stripe
configuration: with no keys set, placing an order creates a real order, marks it
paid, and decrements inventory — but **no card is charged**. This guide takes you
from there to charging real cards. It's three stages: **test mode → verify →
go live**.

The payment toggle is automatic: the moment `STRIPE_SECRET_KEY` is present,
checkout switches from mock to real Stripe Checkout (see `src/lib/stripe.ts`).

---

## Stage 1 — Test mode (fake cards, no real money)

1. Create a Stripe account at https://dashboard.stripe.com and stay in **Test
   mode** (toggle, top-right).

2. Copy your test keys from **Developers → API keys**:
   - **Secret key** → `sk_test_[redacted]...`
   - **Publishable key** → `pk_test_[redacted]...`

3. Add them to your environment. For Docker, put them in `.env` next to
   `docker-compose.yml`:
   ```env
   STRIPE_SECRET_KEY=sk_test_[redacted]
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[redacted]
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   (For local `npm run dev`, set the same vars in your `.env`.)

4. Set up the webhook so paid orders get confirmed. **Webhooks are how the order
   is marked PAID and stock is decremented** — don't skip this.

   **Local testing** — use the Stripe CLI:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   The CLI prints a signing secret like `whsec_[redacted]...`. Put it in `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_[redacted]
   ```
   Keep `stripe listen` running in its own terminal while you test.

5. Restart the app (`docker compose up` or `npm run dev`).

6. Place a test order. On the Stripe payment page use a **test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/34`) · CVC: any 3 digits · ZIP: any
   - More test cards: https://stripe.com/docs/testing

---

## Stage 2 — Verify the full loop

After paying with the test card, confirm the whole chain worked:

1. You're redirected to **`/checkout/success`** with the order number.
2. In **Admin → Orders**, the order shows status **PAID**.
3. In **Admin → Inventory**, that product's stock dropped by the quantity ordered,
   and a **`SALE`** movement appears in the ledger.
4. In the Stripe dashboard (**Payments**), you see the test payment.

If the order stays **PENDING**, the webhook isn't reaching the app — re-check
`STRIPE_WEBHOOK_SECRET` and that `stripe listen` (or your prod endpoint) is
running. (There's a safety net: the success page also reconciles the payment via
the Stripe session, but the webhook is the source of truth — keep it configured.)

---

## Stage 3 — Go live (real cards, real money)

1. In the Stripe dashboard, flip to **Live mode** and complete account
   activation (business details, bank account for payouts).

2. Get your **live** keys from **Developers → API keys**: `sk_live_[redacted]...` and
   `pk_live_[redacted]...`.

3. Create a **live webhook endpoint**: **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://YOURDOMAIN.com/api/webhooks/stripe`
   - Events to send: **`checkout.session.completed`** (and optionally
     `checkout.session.async_payment_succeeded` for delayed methods).
   - After creating it, copy its **Signing secret** (`whsec_[redacted]...`).

4. Set the production environment to the live values and redeploy:
   ```env
   STRIPE_SECRET_KEY=sk_live_[redacted]
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[redacted]
   STRIPE_WEBHOOK_SECRET=whsec_[redacted](from the LIVE endpoint)
   NEXT_PUBLIC_SITE_URL=https://YOURDOMAIN.com
   ```
   ```bash
   docker compose up -d --build
   ```

5. Do one real low-value purchase end-to-end, confirm it lands as PAID in Admin →
   Orders, then refund it from the Stripe dashboard if you like.

---

## Things to know

- **Keys and webhook secret must match modes.** A test webhook secret won't verify
  live events and vice-versa — that's the #1 cause of "orders stuck PENDING."
- **Kava + Stripe.** Kava is generally an acceptable supplement on Stripe (unlike
  kratom). Confirm your specific catalog is fine under Stripe's
  [restricted businesses](https://stripe.com/restricted-businesses) policy before
  launch. If Stripe declines kava for your account, the payment layer is isolated
  to `src/lib/stripe.ts` + `src/app/api/checkout/route.ts` and can be swapped for
  another processor.
- **Shipping & tax.** The store applies a flat shipping rate (free over a
  threshold) and an optional flat tax rate — both editable in **Admin → Settings**.
  These are passed to Stripe as line items so the charged total always matches the
  order. For automated sales-tax calculation, consider enabling Stripe Tax later.
- **Currency** is set in Admin → Settings (default USD).
