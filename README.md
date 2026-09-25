# Big Blue Barn Farm

Mobile-first honey shop for **Big Blue Barn Farm** (Shaw, MS). Customers pick jar sizes, check out with Stripe on-site (Apple Pay / Google Pay / card), and pay USPS Ground Advantage shipping quoted from their ZIP. Built as a Next.js website first; ready to package later for the App Store.

## Stack

- Next.js (App Router) + TypeScript
- Stripe Payment Element (embedded checkout)
- libSQL / Turso via Drizzle (customers, orders, waitlist)
- Resend (order confirmation + farm alert)

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in Stripe, Resend, and USPS keys (and Turso URL for production)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Put the printed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Configure prices & shipping

**Prices:** [`lib/pricing.ts`](lib/pricing.ts) · **Shipping packages:** [`lib/shipping-packages.ts`](lib/shipping-packages.ts)

- `PRICE_PER_OZ_TIERS` — per-ounce rate by jar size; the rate steps down as jars get bigger, matching how Mississippi apiaries price bulk

| Jar | Volume | Rate | Price |
|-----|--------|------|-------|
| Quarter-Pint | 4 oz | $1.25/oz | $5 |
| Half-Pint | 8 oz | $1.00/oz | $8 |
| Pint | 16 oz | $0.88/oz | $14 |
| Quart | 32 oz | $0.75/oz | $24 |

- `NEXT_PUBLIC_HONEY_PRICE_PER_OZ` in `.env.local` / Vercel forces one flat rate at every size and ignores the tiers — leave it unset unless you want that

**Shipping** is live USPS Ground Advantage after the customer enters a ZIP. Boxes and packed weights live in [`lib/shipping-packages.ts`](lib/shipping-packages.ts):

| Jar | Box (in) | Packed weight |
|-----|----------|---------------|
| Quarter-Pint / Half-Pint / Pint | 8 × 5.5 × 5.5 | 12 / 18 / 32 oz |
| Quart | 8.375 × 5.25 × 5.25 | 51 oz |

Create an app at [developers.usps.com](https://developers.usps.com/), enable Domestic Prices, and set `USPS_CLIENT_ID` + `USPS_CLIENT_SECRET`. Checkout is blocked if USPS cannot return a rate (no flat-rate fallback).

Jar catalog (names, images): [`lib/products.ts`](lib/products.ts).

Replace placeholder PNGs in `public/images/products/` with your photos when ready.

## Inventory

**Starting jar counts:** [`lib/inventory-config.ts`](lib/inventory-config.ts)

```ts
export const INVENTORY_SEED = {
  "quarter-pint": { quantity: 24, lowStockAt: 5 },
  "half-pint": { quantity: 24, lowStockAt: 5 },
  pint: { quantity: 18, lowStockAt: 4 },
  quart: { quantity: 12, lowStockAt: 3 },
};
```

- Seeds the database on first run (does not overwrite later sales)
- Each paid order decrements stock
- When a size hits `lowStockAt` (or zero), you get one email alert to `contact@bigbluebarn.farm`
- Shop UI shows **Only X left** / **Sold out** badges
- Checkout blocks orders that exceed available jars

**Restock** (after first seed):

```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -H "x-inventory-secret: $INVENTORY_ADMIN_SECRET" \
  -d '{"updates":[{"productId":"pint","quantity":20},{"productId":"quart","quantity":10}]}'
```

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js / Payment Element |
| `STRIPE_SECRET_KEY` | Create PaymentIntents |
| `STRIPE_WEBHOOK_SECRET` | Mark orders paid + send email |
| `DATABASE_URL` | `file:./data/honey.db` locally, or Turso `libsql://...` |
| `DATABASE_AUTH_TOKEN` | Turso auth token (production) |
| `RESEND_API_KEY` | Transactional email |
| `RESEND_FROM_EMAIL` | Verified sender |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL / payment return |
| `INVENTORY_ADMIN_SECRET` | Auth for restocking via `POST /api/inventory` |
| `USPS_CLIENT_ID` | USPS OAuth client id (Domestic Prices) |
| `USPS_CLIENT_SECRET` | USPS OAuth client secret |
| `USPS_API_BASE` | Optional; defaults to `https://apis.usps.com` |

## Deploy (Vercel)

1. Push repo and import into Vercel
2. Create a free [Turso](https://turso.tech) database; set `DATABASE_URL` + `DATABASE_AUTH_TOKEN`
3. Add Stripe live keys + webhook endpoint `https://your-domain/api/webhook` for `payment_intent.succeeded`
4. Verify domain in Resend; set `RESEND_FROM_EMAIL`
5. Enable Apple Pay in Stripe Dashboard for your domain

## Pages

- `/` — hero + jar picker + FAQ
- `/order` — full jar catalog
- `/reorder` — QR landing for empty jars (`?size=pint` highlights that jar)
- `/checkout` — shipping address + USPS rate + embedded pay
- `/order/success` — confirmation
- `/about` — story, map, honey-flow waitlist

## Ops

- Payments & refunds: Stripe Dashboard
- Customer emails / marketing opt-ins / waitlist: rows in `customers`, `orders`, `waitlist` tables
- Farm gets an email on every paid order (`contact@bigbluebarn.farm`)

## Phase 2 — App Store

When the mobile site is stable:

1. Enroll in Apple Developer Program ($99/yr)
2. Wrap the production URL with [Capacitor](https://capacitorjs.com/) (or a thin Expo WebView shell)
3. Use Stripe Payment Sheet / Payment Element in the native shell so checkout stays in-app
4. Submit with a focus on reordering honey

Same Next.js API and Stripe backend — no separate commerce stack required.

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```
