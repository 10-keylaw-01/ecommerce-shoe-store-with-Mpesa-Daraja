# Supabase backend

Postgres + Auth + Storage for the shoe shop. The public site and the (future) admin dashboard both read/write **only** through these tables; access is enforced by Row Level Security.

## Schema overview

```
CATALOG                                SALES
categories ─┐                          auth.users ─1:1─ customers ─┬─< addresses
brands ─────┼─< products ─┬─< product_variants ─┐                  │
            │             └─< product_images    │                  └─< orders ─┬─< order_items >─ product_variants
            │                                   │                              └─< order_status_history (trigger)
ENGAGEMENT                                      │
contact_requests, newsletter_subscribers        │   CONTENT
custom_requests >─ customers (optional)         │   blog_categories ─< blogs
reviews >─ products, customers (optional)       │   pages, banners, faqs, site_settings (key/value)

ADMIN
auth.users ─1:1─ admin_users (role: owner|admin|editor)  ──<  admin_activity_log
```

Conventions: `id uuid`, `created_at`, `updated_at` (trigger-maintained) on every table; content tables add `status` (`draft|published|archived`) and `sort_order`. No enums (text + CHECK), money is `numeric(10,2)`. Exception: `site_settings` is keyed by `key`.

## Access model

| Who | Can |
|---|---|
| anon / visitors | SELECT `published` rows of categories, brands, products, variants, images, reviews, blogs, blog_categories, pages, banners (inside their date window), faqs; all of `site_settings`. INSERT only into contact/custom requests, newsletter, reviews (reviews land as `draft`). |
| signed-in customer | Above, plus read/update own `customers` row, full CRUD on own `addresses`, read own `orders` / `order_items` / reviews / custom requests. |
| admin (`admin_users` row) | Full CRUD everywhere (`public.is_admin()`), write to the 4 storage buckets. Only `owner` can edit `admin_users`. |

Notes:
- Orders are **not** insertable by customers. Create them from a trusted place (Edge Function / server using the secret key).
- Insert-only forms: don't chain `.select()` after `.insert()` from the browser — anon has no SELECT on those tables.
- `site_settings` is public: never put secrets in it.
- Deviation from the brief: `reviews.customer_id` is nullable (+ `reviewer_name`) so anonymous visitors can submit reviews, as the brief's anon-INSERT rule implies.

## Running migrations

Files in `migrations/` run in order (001 → 008). `008_seed.sql` is sample data — skip it in production.

**Option A — Supabase CLI (recommended)**
```bash
npx supabase login
npx supabase link --project-ref xtugdlyhyulxpxxsbwko   # asks for the DB password
npx supabase db push
```

**Option B — SQL editor**: paste each file into Dashboard → SQL Editor, in order.

**Option C — psql via the shared pooler**
```bash
for f in supabase/migrations/*.sql; do
  psql "postgresql://postgres.xtugdlyhyulxpxxsbwko:<DB_PASSWORD>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" -v ON_ERROR_STOP=1 -f "$f"
done
```

### Making yourself an admin
1. Sign up / create your user in Dashboard → Authentication → Users and copy its UUID.
2. `insert into public.admin_users (id, email, role) values ('<uuid>', 'you@domain.com', 'owner');`
3. Delete the two placeholder admins/auth users created by the seed.

### Regenerating types
`npx supabase gen types typescript --project-id xtugdlyhyulxpxxsbwko > src/types/db.generated.ts`
(`src/types/db.ts` is hand-written; swap to the generated file once you like it.)

## Checklist: add a new table
1. New migration `009_<name>.sql`: `create table public.<plural_snake> (id uuid pk default gen_random_uuid(), …, created_at, updated_at)`; add `status` + `sort_order` if it's content.
2. `comment on table …`; index every FK, `status`, and `slug`.
3. `select public.attach_standard_triggers('public.<table>', true);` (second arg = audit log for admin edits).
4. `alter table … enable row level security;` + admin policy `for all to authenticated using (public.is_admin()) with check (public.is_admin())`.
5. Add public policies only if the site needs it (`for select to anon, authenticated using (status = 'published')`).
6. Add the Row interface and `TableDef` entry in `src/types/db.ts` (or regenerate).
7. Add a seed row (optional).

## Checklist: new content type end-to-end (example: `testimonials`)
1. **SQL** – migration with the table (`quote`, `author`, `status`, `sort_order`), standard triggers, RLS (admin all + public read published).
2. **Types** – `Testimonial` interface + `testimonials: TableDef<Testimonial, Content | …>` in `db.ts`.
3. **Admin page** – list (`supabase.from('testimonials').select('*').order('sort_order')`), create/update/delete forms, status toggle. Images go to a storage bucket; store the public URL in a column.
4. **Public query** –
   ```js
   const { data } = await supabase.from('testimonials').select('*').order('sort_order')
   ```
   RLS already filters to `published`, so no `.eq('status','published')` is required (adding it is harmless).
5. For one-off editable copy (not a list), skip all of this and add a key to `site_settings`.
