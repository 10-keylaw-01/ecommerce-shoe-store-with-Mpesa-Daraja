# Lovfoot store

React + Vite storefront, Supabase backend (Postgres/Auth/Storage), and a small Node server for M-Pesa checkout.

## Run it

```bash
npm install
npm run dev        # Vite on :5173 (/api is proxied) + checkout server on :8787
npm start          # production: builds, then the server serves dist/ and /api on :8787
```

Config lives in `.env.local` (see `.env.example`). Browser-safe keys are `VITE_*`; everything else is server-only.

## What comes from the backend

Nothing on the storefront is hardcoded any more:

| Storefront | Source |
|---|---|
| Products, sizes/stock, images, badge, specs | `products`, `product_variants`, `product_images` |
| Categories & filters, footer "Series" links | `categories` |
| Home hero, "Own the Darkness" block, Collection header | `banners` (`home_hero`, `home_mid`, `category_top`) |
| All other page copy (Home, Atelier, Performance, Contact), announcement bar, footer, socials, shipping | `site_settings` |
| FAQs (Contact page), Privacy/Terms (`/pages/:slug`) | `faqs`, `pages` |
| Contact, custom order, newsletter, reviews | written to `contact_requests`, `custom_requests`, `newsletter_subscribers`, `reviews` |

## Pages & features

Home, Collection (search, category/gender/in-stock filters, sorting), Product (sizes with live stock, size guide, wishlist, reviews), Cart + M-Pesa Quick Checkout, Atelier, Performance, **Journal** (`/journal`, `/journal/:slug`), **FAQ** (`/faq`), **Track Order** (`/track-order` — order number + phone), **Wishlist** (`/wishlist`, saved in the browser), live **search** overlay, CMS pages (`/pages/about`, `/pages/shipping-returns`, `/pages/privacy`, `/pages/terms`), and a 404. Fully responsive (phone, tablet, desktop), including the admin.

## Admin (`/admin`)

Sign in with a user listed in `admin_users` (see `supabase/README.md`). Sections: Dashboard (revenue, orders, low stock, inbox), Products (details, specs, sizes & stock, images), Categories, Brands, Orders (status updates, M-Pesa payments, history), M-Pesa payments, Customers, Reviews (approve drafts), Messages, Custom requests, Subscribers, **Site content** (structured editor for every page's copy/images), Banners, FAQs, Pages, Blog.

## M-Pesa checkout

Cart → **Quick Checkout** → `POST /api/checkout` (server re-prices from the DB, checks stock, creates the order, sends the STK push) → browser polls `/api/checkout/status/:id` → Safaricom calls `POST /api/mpesa/callback/<secret>` → order becomes `paid`, stock is decremented (`mark_order_paid()`).

- Prices are stored and shown in Kenyan shillings (KSh) and charged to M-Pesa as-is (rounded to whole shillings). Shipping fee and free-shipping threshold are in KSh too (Admin → Site content → Checkout & shipping).
- **Callback URL**: Safaricom must reach it over public HTTPS. Locally, run a tunnel (e.g. `ngrok http 8787`) and set `MPESA_CALLBACK_BASE` to the tunnel URL. Without it the server falls back to polling Daraja's STK query, but the sandbox often answers that with "still processing".
- Sandbox shortcode/passkey are Safaricom's public test values (`174379`). For production set `MPESA_ENV=production` and your own shortcode, passkey and keys.
- Secrets (`MPESA_*`, `SUPABASE_SECRET_KEY`) are read only by `server/`.

## Database

Migrations are in `supabase/migrations` (`009` = guest checkout + payments, `010` = Lovfoot catalog/content). Apply with `npx supabase db push` or `npx supabase db query --linked -f <file>`.
# ecommerce-shoe-store-with-Mpesa-Daraja
