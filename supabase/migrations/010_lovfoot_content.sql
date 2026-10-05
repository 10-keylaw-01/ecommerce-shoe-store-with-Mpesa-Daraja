-- 010: move the Lovfoot storefront content (catalog + page copy) into the database.
-- Replaces the generic sample catalog: old sample rows are archived (not deleted), so
-- they disappear from the site but remain recoverable from the admin.

update public.products set status = 'archived' where brand_id in (select id from public.brands where slug in ('stridewell','northpeak','lumo','oakline'));
update public.categories set status = 'archived' where slug in ('sneakers','running','boots','sandals');
update public.brands     set status = 'archived' where slug in ('stridewell','northpeak','lumo','oakline');
update public.banners    set status = 'archived' where title in ('Step Into Spring','Free Shipping Over $150','Boot Season');

insert into public.brands (name, slug, description, status, sort_order)
values ('Lovfoot', 'lovfoot', 'Precision engineering for the modern ascetic.', 'published', 0)
on conflict (slug) do update set status = 'published';

insert into public.categories (name, slug, description, status, sort_order) values
  ('Trail',       'trail',       'Rugged durability for uneven terrain.',       'published', 1),
  ('Urban',       'urban',       'Sleek silhouettes built for the city.',        'published', 2),
  ('Performance', 'performance', 'Carbon plate architecture. Built for velocity.', 'published', 3)
on conflict (slug) do update set status = 'published';

insert into public.products (name, slug, short_description, description, price, compare_at_price,
                             brand_id, category_id, gender, status, sort_order, is_featured, badge, specs)
select v.name, v.slug, v.short_desc, v.descr, v.price, v.compare_at, b.id, c.id, v.gender, 'published', v.ord, v.featured, v.badge, v.specs::jsonb
from (values
  ('Apex Terra','apex-terra','Carbon plate trail silhouette.','Rugged durability meets metropolitan style in a silhouette defined by contrast. Carbon plate architecture with hand-finished leather details.',285.00,320.00,'trail','men',1,true,'Limited Edition','{"weight":"198g","drop":"8mm","material":"Composite Knit","sole":"Carbon Reactive"}'),
  ('Dune Hiker','dune-hiker','Espresso knit long-haul hiker.','Built for the long haul. Espresso knit upper with composite shank for uneven terrain.',225.00,null,'trail','unisex',2,true,'','{"weight":"220g","drop":"6mm","material":"Espresso Knit","sole":"Adaptive Foam"}'),
  ('Obsidian Walker','obsidian-walker','Sleek obsidian city shoe.','The city is your terrain. Sleek obsidian finish with reactive sole technology.',195.00,230.00,'urban','unisex',3,true,'','{"weight":"185g","drop":"10mm","material":"Full-grain Leather","sole":"Reactive Foam"}'),
  ('Stratus Noir','stratus-noir','Midnight edition night runner.','Midnight edition. Engineered for the night runner who demands both performance and presence.',180.00,null,'urban','men',4,false,'Midnight Edition','{"weight":"175g","drop":"8mm","material":"Mesh Knit","sole":"Carbon Plate"}'),
  ('Terra Bronze','terra-bronze','Desert-inspired composite upper.','Desert-inspired colorway with aerospace-grade composite upper. Built for velocity.',210.00,250.00,'trail','women',5,false,'Desert Ops','{"weight":"192g","drop":"6mm","material":"Woven Composite","sole":"Adaptive Foam"}'),
  ('Stealth Runner','stealth-runner','Zero-profile urban tactician.','Zero-profile silhouette. Maximum energy return. The stealth runner for urban tacticians.',160.00,null,'performance','unisex',6,false,'Urban Tactical','{"weight":"162g","drop":"4mm","material":"Tactical Mesh","sole":"Reactive Sole"}'),
  ('Canyon Lo','canyon-lo','Low-profile canyon earth tones.','Low-profile canyon-inspired silhouette. Earth tones meet precision engineering.',195.00,220.00,'urban','women',7,false,'Limited Release','{"weight":"178g","drop":"8mm","material":"Suede Composite","sole":"Adaptive Foam"}'),
  ('Lunar Drift','lunar-drift','Grey series full carbon plate.','Grey series. Lunar-inspired colorway with full carbon plate and adaptive foam midsole.',240.00,null,'performance','men',8,false,'','{"weight":"188g","drop":"6mm","material":"Lunar Knit","sole":"Carbon Plate"}')
) as v(name, slug, short_desc, descr, price, compare_at, cat, gender, ord, featured, badge, specs)
join public.brands b on b.slug = 'lovfoot'
join public.categories c on c.slug = v.cat
on conflict (slug) do update set status = 'published', badge = excluded.badge, specs = excluded.specs;

-- Sizes (one variant per size) with starting stock.
insert into public.product_variants (product_id, size, color, sku, stock, status, sort_order)
select p.id, s.size, 'Default', upper(left(p.slug, 3)) || '-' || replace(s.size, 'US ', 'US') , 25, 'published', s.n
from public.products p
join (values
  ('apex-terra', array['US 7','US 8','US 9','US 10','US 11','US 12']),
  ('dune-hiker', array['US 6','US 7','US 8','US 9','US 10','US 11']),
  ('obsidian-walker', array['US 7','US 8','US 9','US 10','US 11']),
  ('stratus-noir', array['US 7','US 8','US 9','US 10','US 11','US 12']),
  ('terra-bronze', array['US 5','US 6','US 7','US 8','US 9','US 10']),
  ('stealth-runner', array['US 6','US 7','US 8','US 9','US 10','US 11','US 12']),
  ('canyon-lo', array['US 5','US 6','US 7','US 8','US 9']),
  ('lunar-drift', array['US 7','US 8','US 9','US 10','US 11','US 12'])
) m(slug, sizes) on m.slug = p.slug
cross join lateral unnest(m.sizes) with ordinality as s(size, n)
on conflict (sku) do nothing;

-- Images
insert into public.product_images (product_id, url, alt_text, sort_order)
select p.id, i.url, p.name, i.n
from public.products p
join (values
  ('apex-terra', 1, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1664&auto=format&fit=crop'),
  ('apex-terra', 2, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop'),
  ('dune-hiker', 1, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=987&auto=format&fit=crop'),
  ('obsidian-walker', 1, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1064&auto=format&fit=crop'),
  ('stratus-noir', 1, 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?q=80&w=987&auto=format&fit=crop'),
  ('terra-bronze', 1, 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=2071&auto=format&fit=crop'),
  ('stealth-runner', 1, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1974&auto=format&fit=crop'),
  ('canyon-lo', 1, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2071&auto=format&fit=crop'),
  ('lunar-drift', 1, 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=2070&auto=format&fit=crop')
) i(slug, n, url) on i.slug = p.slug
where not exists (select 1 from public.product_images x where x.product_id = p.id and x.url = i.url);

-- Banners: hero, lifestyle section, collection header.
delete from public.banners where title in ('Primal Elegance.', 'Own the Darkness.', 'The Collection');
insert into public.banners (title, subtitle, image_url, cta_text, cta_link, placement, status, sort_order) values
  (E'Primal \nElegance.', 'Engineered from the ground up. A fusion of raw earth tones and aerospace-grade composites.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop', 'Explore Men', '/collection?gender=men', 'home_hero', 'published', 1),
  (E'Own the \nDarkness.', 'Join the night runners. The midnight club pushing limits when the city sleeps.', 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=2011&auto=format&fit=crop', 'Shop the Collection', '/collection', 'home_mid', 'published', 1),
  ('The Collection', 'Every silhouette. Every series. Engineered for the terrain you choose.', '', '', '', 'category_top', 'published', 1);

-- Site settings (jsonb). Objects/arrays are edited as structured forms in Admin > Site content.
insert into public.site_settings (key, value, description) values
  ('site_name', '"Lovfoot"', 'Brand name'),
  ('tagline', '"Precision engineering for the modern ascetic."', 'Short slogan'),
  ('announcement_bar', '"Complimentary Global Shipping • Obsidian Series"', 'Top announcement bar'),
  ('contact_email', '"hello@lovfoot.com"', 'Public contact email'),
  ('contact_phone', '"+254 700 000 000"', 'Public contact phone'),
  ('footer_text', '"© 2026 Lovfoot Inc."', 'Footer copyright line'),
  ('footer_blurb', '"Precision engineering for the modern ascetic. Based in the Pacific Northwest."', 'Footer description'),
  ('social_instagram', '"https://instagram.com/lovfoot"', 'Instagram URL'),
  ('social_x', '"https://x.com/lovfoot"', 'X URL'),
  ('flat_shipping_rate', '0', 'Shipping charged below the free-shipping threshold (USD)'),
  ('free_shipping_threshold', '0', 'Subtotal (USD) at which shipping becomes free'),
  ('usd_to_kes_rate', '129', 'Prices are in USD; M-Pesa charges KES at this rate'),
  ('home_hero_extras', '{"badge":"Series 04 — Carbon","cta2_text":"Explore Women","cta2_link":"/collection?gender=women"}', 'Hero badge and second button'),
  ('home_ticker', '["Carbon Plate Architecture","Hand-finished Leather Details","Adaptive Foam","Reactive Sole"]', 'Scrolling ticker items'),
  ('home_palette', '{"title":"The Earth Palette","subtitle":"Inspired by terrain. Built for velocity."}', 'Featured collection heading'),
  ('home_specs', '{"eyebrow":"Specifications","title1":"Defying","title2":"Gravity.","body":"Our proprietary compound creates a responsive energy return system that feels organic yet powerful. Wrapped in ethically sourced materials dyed with natural earth pigments.","image":"https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=2070&auto=format&fit=crop","weight_value":"198","weight_unit":"g","drop_value":"8","drop_unit":"mm","features":[{"title":"Composite Shank","desc":"Rigid stability for uneven terrain."},{"title":"Espresso Knit","desc":"Breathable, high-tensile fiber weave."},{"title":"Carbon Plate","desc":"Aerospace-grade energy return system."},{"title":"Adaptive Foam","desc":"Responsive cushioning that molds to your stride."}]}', 'Home specifications section'),
  ('home_arrivals', '{"title":"New Arrivals"}', 'New arrivals heading'),
  ('atelier', '{"hero_image":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop","eyebrow":"The Atelier","title1":"Craft Without","title2":"Compromise.","story_eyebrow":"Our Story","story_title1":"Born from the","story_title2":"Pacific Northwest.","story_p1":"Lovfoot was founded in 2019 by a team of industrial designers and trail runners who were tired of choosing between performance and aesthetics. We set out to build footwear that could handle the rugged terrain of the Pacific Northwest while looking at home in the city.","story_p2":"Every pair is designed in our Portland atelier and assembled by hand in small batches. We believe in the slow fashion movement — fewer, better things made to last a lifetime.","story_image":"https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=2070&auto=format&fit=crop","materials_title":"What We''re Made Of","materials":[{"name":"Espresso Knit","tag":"Upper","desc":"High-tensile fiber woven at 400 threads per inch. Breathable, durable, and naturally temperature-regulating."},{"name":"Carbon Plate","tag":"Midsole","desc":"Aerospace-grade carbon fiber shank providing rigid stability and explosive energy return with every stride."},{"name":"Adaptive Foam","tag":"Cushioning","desc":"Proprietary compound that responds to your unique gait pattern, providing personalized cushioning over time."},{"name":"Reactive Sole","tag":"Outsole","desc":"Vulcanized rubber compound with micro-texture grip pattern. Tested across 12 terrain types."},{"name":"Earth-dyed Leather","tag":"Accent","desc":"Full-grain leather sourced from ethical tanneries, dyed using natural earth pigments from the Pacific Northwest."},{"name":"Composite Shank","tag":"Structure","desc":"Rigid mid-foot support structure engineered for uneven terrain without sacrificing flexibility at the toe box."}],"values_title":"Built for the Long Run","values":[{"title":"Ethical Sourcing","desc":"Every material is traced back to its origin. We partner only with suppliers who meet our strict environmental and labor standards."},{"title":"Zero Waste Production","desc":"Our Pacific Northwest atelier operates on a zero-waste mandate. Offcuts are repurposed into accessories and packaging."},{"title":"Carbon Neutral by 2026","desc":"We are on track to achieve full carbon neutrality across our supply chain by 2026, with verified offsets for the remainder."}]}', 'Atelier page'),
  ('performance', '{"hero_image":"https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1664&auto=format&fit=crop","eyebrow":"Performance Series","title1":"Built for","title2":"Velocity.","body":"Aerospace-grade composites. Adaptive foam technology. Carbon plate architecture. Every gram engineered with purpose.","cta_text":"Shop Performance","cta_link":"/collection?cat=performance","stats":[{"value":"198g","label":"Lightest Model"},{"value":"8mm","label":"Heel Drop"},{"value":"400+","label":"Thread Count"},{"value":"12","label":"Terrain Types Tested"}],"tech_title":"The Science of Speed","tech":[{"title":"Carbon Plate Architecture","desc":"Our proprietary carbon fiber plate is positioned at the optimal angle to maximize energy return at toe-off, reducing metabolic cost by up to 4%.","image":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop"},{"title":"Adaptive Foam Compound","desc":"The midsole compound responds dynamically to impact force, providing softer cushioning on hard surfaces and firmer support on technical terrain.","image":"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=987&auto=format&fit=crop"}],"models_title":"Performance Models","category_slugs":["performance","trail"]}', 'Performance page'),
  ('contact', '{"eyebrow":"Get in Touch","title":"Contact Us","subtitle":"Questions, custom orders, or just want to talk shoes — we''re here.","info":[{"label":"Email","value":"hello@lovfoot.com"},{"label":"Phone","value":"+254 700 000 000"},{"label":"Atelier","value":"1204 NW Lovejoy St\nPortland, OR 97209"},{"label":"Hours","value":"Mon–Fri: 9am – 6pm\nSat: 10am – 4pm"}],"custom_note":"Custom orders are hand-crafted in our Portland atelier. Lead time is 6–8 weeks.","budget_ranges":["$300–$500","$500–$800","$800–$1200","$1200+"]}', 'Contact page')
on conflict (key) do update set value = excluded.value, description = excluded.description;

delete from public.site_settings where key in ('seo_default_title','seo_default_description') and value::text like '%Stridewell%';
update public.site_settings set value = '"Lovfoot"' where key = 'site_name';

-- Legal pages (footer links).
update public.pages set status = 'archived' where slug in ('about','shipping');
insert into public.pages (title, slug, content_md, status, sort_order) values
  ('Privacy Policy', 'privacy', E'# Privacy Policy\n\nWe collect only what we need to fulfil your order: your name, phone number, email and delivery details. We never sell your data.\n\n## Payments\nM-Pesa payments are processed by Safaricom. We never see or store your M-Pesa PIN.', 'published', 10),
  ('Terms of Service', 'terms', E'# Terms of Service\n\nBy placing an order you agree to these terms.\n\n## Orders\nAn order is confirmed once payment is received.\n\n## Returns\nUnworn pairs may be returned within 30 days.', 'published', 11)
on conflict (slug) do update set status = 'published';

update public.faqs set status = 'archived';
insert into public.faqs (question, answer, category, status, sort_order) values
  ('How do I pay?', 'Add items to your cart and use Quick Checkout. Enter your M-Pesa number and approve the prompt on your phone.', 'payments', 'published', 1),
  ('How long does delivery take?', 'Orders are dispatched within 2 business days.', 'shipping', 'published', 2),
  ('What is your return policy?', 'Unworn pairs can be returned within 30 days for a full refund.', 'returns', 'published', 3),
  ('Can I order a custom pair?', 'Yes — use the Custom Order tab on this page.', 'custom', 'published', 4);
