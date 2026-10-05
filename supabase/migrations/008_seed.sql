-- 008: sample data so the frontend can be built immediately.
-- Remove this file (or skip it) for a production project. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Placeholder auth users (cannot sign in: no password, no identities)
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select v.id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       v.email, '', now(), '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', v.full_name), now(), now(),
       '', '', '', '', '', '', '', ''  -- GoTrue cannot read NULL token columns
from (values
  ('c1000000-0000-4000-8000-000000000001', 'amara.okafor@example.com', 'Amara Okafor'),
  ('c1000000-0000-4000-8000-000000000002', 'liam.becker@example.com',  'Liam Becker'),
  ('c1000000-0000-4000-8000-000000000003', 'sofia.ramirez@example.com','Sofia Ramirez'),
  ('ad000000-0000-4000-8000-000000000001', 'owner@example.com',        'Placeholder Owner'),
  ('ad000000-0000-4000-8000-000000000002', 'editor@example.com',       'Placeholder Editor')
) as v(id, email, full_name)
on conflict (id) do nothing;
-- handle_new_user() created a customers row for every auth user; drop the admin ones, fill in phones.
delete from public.customers where id::text like 'ad000000%';
update public.customers set phone = '+1 555 0101' where email = 'amara.okafor@example.com';
update public.customers set phone = '+49 555 0102' where email = 'liam.becker@example.com';
update public.customers set phone = '+34 555 0103' where email = 'sofia.ramirez@example.com';

-- ---------------------------------------------------------------------------
-- Admins
-- HOW TO LINK REAL ADMINS: sign up (or invite) your real user in
-- Authentication > Users, copy its UUID, then run:
--   insert into public.admin_users (id, email, role) values ('<auth-user-uuid>', 'you@domain.com', 'owner');
-- and delete the two placeholders:
--   delete from auth.users where id in ('ad000000-0000-4000-8000-000000000001','ad000000-0000-4000-8000-000000000002');
-- ---------------------------------------------------------------------------
insert into public.admin_users (id, email, role) values
  ('ad000000-0000-4000-8000-000000000001', 'owner@example.com',  'owner'),
  ('ad000000-0000-4000-8000-000000000002', 'editor@example.com', 'editor')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, image_url, status, sort_order) values
  ('Sneakers', 'sneakers', 'Everyday court and street styles.',          'https://picsum.photos/seed/cat-sneakers/800/600', 'published', 1),
  ('Running',  'running',  'Cushioned, lightweight shoes for the miles.', 'https://picsum.photos/seed/cat-running/800/600',  'published', 2),
  ('Boots',    'boots',    'Leather and weatherproof boots built to last.','https://picsum.photos/seed/cat-boots/800/600',    'published', 3),
  ('Sandals',  'sandals',  'Slides and sandals for warm days.',           'https://picsum.photos/seed/cat-sandals/800/600',  'published', 4)
on conflict (slug) do nothing;

insert into public.brands (name, slug, logo_url, description, status, sort_order) values
  ('Stridewell', 'stridewell', 'https://picsum.photos/seed/brand-stridewell/200/200', 'Honest everyday footwear since 1998.',       'published', 1),
  ('Northpeak',  'northpeak',  'https://picsum.photos/seed/brand-northpeak/200/200',  'Performance gear for trail and track.',      'published', 2),
  ('Lumo',       'lumo',       'https://picsum.photos/seed/brand-lumo/200/200',       'Soft, light, sustainably made.',             'published', 3),
  ('Oakline',    'oakline',    'https://picsum.photos/seed/brand-oakline/200/200',    'Heritage leatherwork and resoleable boots.', 'published', 4)
on conflict (slug) do nothing;

insert into public.products (name, slug, short_description, description, price, compare_at_price,
                             brand_id, category_id, gender, status, sort_order, is_featured, tags)
select v.name, v.slug, v.short_desc, v.short_desc || ' Designed for all-day comfort with a durable outsole and breathable lining.',
       v.price, v.compare_at, b.id, c.id, v.gender, 'published', v.ord, v.featured, v.tags
from (values
  ('Court Classic',     'court-classic',     'A timeless leather court sneaker.', 'stridewell','sneakers','unisex', 89.00,  null::numeric, 1,  true,  array['classic','leather']),
  ('Metro Low',         'metro-low',         'A clean low-top for city streets.', 'stridewell','sneakers','men',    99.00,  null,          2,  false, array['casual']),
  ('Trail Runner',      'trail-runner',      'Grippy waterproof shoe for muddy trails.', 'northpeak', 'running', 'men',    129.00, 149.00,        3,  true,  array['trail','waterproof']),
  ('Aero Racer',        'aero-racer',        'Featherweight road racer with a springy foam.', 'northpeak', 'running', 'women',  139.00, null,          4,  true,  array['road','lightweight']),
  ('Cloud Knit',        'cloud-knit',        'A sock-like knit sneaker that feels like walking on air.', 'lumo',      'sneakers','women',  109.00, null,          5,  false, array['knit','vegan']),
  ('Daybreak Runner',   'daybreak-runner',   'Daily trainer made with recycled materials.', 'lumo',      'running', 'unisex', 119.00, null,          6,  false, array['road','recycled']),
  ('Ridge Boot',        'ridge-boot',        'Resoleable full-grain leather boot.', 'oakline',   'boots',   'men',    169.00, 199.00,        7,  true,  array['leather','resoleable']),
  ('Hearth Chelsea',    'hearth-chelsea',    'Sleek leather Chelsea boot with elastic gussets.', 'oakline',   'boots',   'women',  159.00, null,          8,  false, array['leather','chelsea']),
  ('Summit Hiker',      'summit-hiker',      'Waterproof hiking boot with aggressive tread.', 'northpeak', 'boots',   'unisex', 179.00, null,          9,  false, array['hiking','waterproof']),
  ('Breeze Slide',      'breeze-slide',      'Cushioned vegan slide for the beach or pool.', 'lumo',      'sandals', 'unisex', 49.00,  null,          10, false, array['summer','vegan']),
  ('Sprout Kids Sneaker','sprout-kids-sneaker','Easy-on velcro sneaker for little feet.', 'stridewell','sneakers','kids',  59.00,  null,          11, false, array['kids','velcro']),
  ('Dune Sandal',       'dune-sandal',       'Hand-stitched leather sandal with a cork footbed.', 'oakline',   'sandals', 'women',  69.00,  79.00,         12, false, array['summer','leather'])
) as v(name, slug, short_desc, brand, cat, gender, price, compare_at, ord, featured, tags)
join public.brands b     on b.slug = v.brand
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- 3-6 variants per product, deterministic from product order.
insert into public.product_variants (product_id, size, color, sku, price_override, stock, status, sort_order)
select p.id, s.size, p.color,
       'SH' || lpad(p.rn::text, 2, '0') || '-' || s.size || '-' || upper(left(p.color, 3)),
       case when s.n = 6 then p.price + 10 end,
       (p.rn * 7 + s.n * 3) % 25,
       'published', s.n
from (
  select id, price, row_number() over (order by sort_order) as rn,
         (array['Black','White','Navy','Olive','Sand','Red'])[1 + (row_number() over (order by sort_order))::int % 6] as color
  from public.products
) p
cross join lateral (
  select size, n from (values ('40',1),('41',2),('42',3),('43',4),('44',5),('45',6)) v(size, n)
  where n <= 3 + p.rn % 4
) s
on conflict (sku) do nothing;

-- 2-3 images per product (placeholder photos).
insert into public.product_images (product_id, url, alt_text, sort_order)
select p.id, 'https://picsum.photos/seed/' || p.slug || '-' || g.n || '/800/800', p.name || ' - view ' || g.n, g.n
from public.products p
cross join generate_series(1, 3) as g(n)
where (g.n <= 2 or p.sort_order % 2 = 1)
  and not exists (select 1 from public.product_images i where i.product_id = p.id);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
insert into public.blog_categories (name, slug, status, sort_order) values
  ('Guides', 'guides', 'published', 1),
  ('Care',   'care',   'published', 2),
  ('News',   'news',   'published', 3)
on conflict (slug) do nothing;

insert into public.blogs (title, slug, excerpt, content_md, cover_image_url, author_name, category_id, status, published_at, sort_order)
select v.title, v.slug, v.excerpt, v.body, 'https://picsum.photos/seed/blog-' || v.slug || '/1200/630', v.author,
       bc.id, 'published', now() - (v.days || ' days')::interval, v.ord
from (values
  ('How to Choose Running Shoes',      'how-to-choose-running-shoes', 'Fit, cushioning and terrain: what actually matters.', E'# How to choose running shoes\n\nStart with **fit**: leave a thumb''s width at the toe.\n\n## Cushioning\nSofter for long easy runs, firmer for speed.\n\n## Terrain\nRoad shoes grip less than trail lugs.', 'Maya Chen', 'guides', 3, 1),
  ('Caring for Leather Boots',         'caring-for-leather-boots',    'Five minutes a month keeps boots alive for a decade.', E'# Caring for leather boots\n\n1. Brush off dirt.\n2. Wipe with a damp cloth.\n3. Condition sparingly.\n4. Stuff with newspaper to dry.', 'Tom Hadley', 'care', 10, 2),
  ('Sneaker Sizing Explained',         'sneaker-sizing-explained',    'EU, US and UK sizes decoded with a handy chart.', E'# Sneaker sizing explained\n\nMeasure your foot at the end of the day and compare to our size chart.', 'Maya Chen', 'guides', 18, 3),
  ('Our New Recycled Collection',      'new-recycled-collection',     'Lumo debuts shoes made from ocean plastic.', E'# New recycled collection\n\nEvery pair keeps 8 bottles out of the ocean.', 'Priya Nair', 'news', 25, 4),
  ('Break In New Shoes Without Pain',  'break-in-new-shoes',          'Simple tricks to avoid blisters.', E'# Breaking in new shoes\n\nWear them indoors with thick socks for short stretches first.', 'Tom Hadley', 'care', 33, 5),
  ('Spring Trail Guide',               'spring-trail-guide',          'Our favourite beginner trails and the shoes to wear.', E'# Spring trail guide\n\nMud, roots and puddles: choose waterproof lugs.', 'Priya Nair', 'guides', 41, 6)
) as v(title, slug, excerpt, body, author, cat, days, ord)
join public.blog_categories bc on bc.slug = v.cat
on conflict (slug) do nothing;

insert into public.banners (title, subtitle, image_url, cta_text, cta_link, placement, status, sort_order)
select * from (values
  ('Step Into Spring',      'New arrivals across every category.', 'https://picsum.photos/seed/banner-hero/1600/700', 'Shop new',      '/products?sort=newest',   'home_hero',    'published', 1),
  ('Free Shipping Over $150','Fast delivery, easy returns.',        'https://picsum.photos/seed/banner-mid/1600/500',  'See details',   '/pages/shipping',         'home_mid',     'published', 1),
  ('Boot Season',           'Resoleable boots built to last.',      'https://picsum.photos/seed/banner-boots/1600/400','Shop boots',    '/category/boots',         'category_top', 'published', 1)
) as b(title, subtitle, image_url, cta_text, cta_link, placement, status, sort_order)
where not exists (select 1 from public.banners);

insert into public.faqs (question, answer, category, status, sort_order)
select * from (values
  ('How long does shipping take?',    'Orders ship within 2 business days and arrive in 3-7 business days.', 'shipping', 'published', 1),
  ('What is your return policy?',     'Unworn shoes can be returned within 30 days for a full refund.',      'returns',  'published', 2),
  ('How do I find my size?',          'Use the size chart on each product page; when between sizes, size up.','sizing',  'published', 3),
  ('Can I order a custom pair?',      'Yes - send us a custom request via the Custom Orders page.',          'custom',   'published', 4),
  ('Which payment methods do you accept?','All major cards and digital wallets.',                            'payments', 'published', 5)
) as f(q, a, c, s, o)
where not exists (select 1 from public.faqs);

insert into public.pages (title, slug, content_md, status, sort_order) values
  ('About Us',  'about',    E'# About us\n\nWe have been putting people in great shoes since 1998.', 'published', 1),
  ('Shipping',  'shipping', E'# Shipping\n\nFree over $150, otherwise a flat $9.99.',                'published', 2)
on conflict (slug) do nothing;

insert into public.site_settings (key, value, description) values
  ('site_name',               '"Stridewell Shoes"',                       'Brand name shown in header and titles'),
  ('tagline',                 '"Walk your own way"',                      'Short slogan'),
  ('logo_url',                '""',                                       'Header logo (site-assets bucket)'),
  ('contact_email',           '"hello@example.com"',                      'Public contact email'),
  ('contact_phone',           '"+1 555 0100"',                            'Public contact phone'),
  ('contact_address',         '"12 Market Street, Springfield"',          'Store/office address'),
  ('currency',                '"USD"',                                    'ISO currency code for display'),
  ('free_shipping_threshold', '150',                                      'Order subtotal for free shipping'),
  ('flat_shipping_rate',      '9.99',                                     'Shipping charged below threshold'),
  ('announcement_bar',        '"Free shipping on orders over $150"',      'Text in the top announcement bar'),
  ('social_instagram',        '"https://instagram.com/example"',          'Instagram URL'),
  ('social_facebook',         '"https://facebook.com/example"',           'Facebook URL'),
  ('social_x',                '"https://x.com/example"',                  'X/Twitter URL'),
  ('social_tiktok',           '"https://tiktok.com/@example"',            'TikTok URL'),
  ('seo_default_title',       '"Stridewell Shoes - Everyday footwear"',   'Fallback <title>'),
  ('seo_default_description', '"Shop sneakers, running shoes, boots and sandals."', 'Fallback meta description'),
  ('return_window_days',      '30',                                       'Days allowed for returns'),
  ('footer_text',             '"© 2026 Stridewell Shoes. All rights reserved."', 'Footer copyright line'),
  ('maintenance_mode',        'false',                                    'Show maintenance page when true'),
  ('home_featured_count',     '8',                                        'Featured products shown on home')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Sales: addresses + 5 orders
-- ---------------------------------------------------------------------------
insert into public.addresses (customer_id, line1, city, state, postal_code, country, is_default) values
  ('c1000000-0000-4000-8000-000000000001', '14 Lagos Road',    'Austin',    'TX', '73301', 'US', true),
  ('c1000000-0000-4000-8000-000000000002', 'Hauptstrasse 5',   'Berlin',    '',   '10115', 'DE', true),
  ('c1000000-0000-4000-8000-000000000003', 'Calle Mayor 22',   'Madrid',    '',   '28013', 'ES', true)
on conflict do nothing;

insert into public.orders (id, customer_id, order_number, shipping_address, created_at)
select o.id::uuid, o.cust::uuid, o.num, to_jsonb(a) - 'id' - 'customer_id' - 'created_at' - 'updated_at',
       now() - (o.days || ' days')::interval
from (values
  ('b0000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','ORD-SEED-0001', 1),
  ('b0000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000002','ORD-SEED-0002', 4),
  ('b0000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000003','ORD-SEED-0003', 8),
  ('b0000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','ORD-SEED-0004', 15),
  ('b0000000-0000-4000-8000-000000000005','c1000000-0000-4000-8000-000000000002','ORD-SEED-0005', 20)
) as o(id, cust, num, days)
join public.addresses a on a.customer_id = o.cust::uuid and a.is_default
on conflict (order_number) do nothing;

insert into public.order_items (order_id, variant_id, product_name_snapshot, variant_label_snapshot, qty, unit_price, line_total)
select i.order_id::uuid, pv.id, p.name, 'Size ' || pv.size || ' / ' || pv.color, i.qty,
       coalesce(pv.price_override, p.price), i.qty * coalesce(pv.price_override, p.price)
from (values
  ('b0000000-0000-4000-8000-000000000001','court-classic',  '41', 1),
  ('b0000000-0000-4000-8000-000000000001','breeze-slide',   '40', 2),
  ('b0000000-0000-4000-8000-000000000002','trail-runner',   '42', 1),
  ('b0000000-0000-4000-8000-000000000003','ridge-boot',     '41', 1),
  ('b0000000-0000-4000-8000-000000000003','hearth-chelsea', '40', 1),
  ('b0000000-0000-4000-8000-000000000004','aero-racer',     '41', 1),
  ('b0000000-0000-4000-8000-000000000005','metro-low',      '40', 2)
) as i(order_id, slug, size, qty)
join public.products p on p.slug = i.slug
join public.product_variants pv on pv.product_id = p.id and pv.size = i.size
where not exists (select 1 from public.order_items x where x.order_id = i.order_id::uuid);

update public.orders o
set subtotal = t.sub,
    shipping = case when t.sub >= 150 then 0 else 9.99 end,
    total    = t.sub + case when t.sub >= 150 then 0 else 9.99 end
from (select order_id, sum(line_total) as sub from public.order_items group by order_id) t
where t.order_id = o.id and o.order_number like 'ORD-SEED-%' and o.total = 0;

-- Walk statuses forward so order_status_history gets realistic rows via trigger.
update public.orders set status = 'paid'      where order_number in ('ORD-SEED-0002','ORD-SEED-0003','ORD-SEED-0004') and status = 'pending';
update public.orders set status = 'shipped'   where order_number in ('ORD-SEED-0003','ORD-SEED-0004') and status = 'paid';
update public.orders set status = 'delivered' where order_number = 'ORD-SEED-0004' and status = 'shipped';
update public.orders set status = 'cancelled' where order_number = 'ORD-SEED-0005' and status = 'pending';
