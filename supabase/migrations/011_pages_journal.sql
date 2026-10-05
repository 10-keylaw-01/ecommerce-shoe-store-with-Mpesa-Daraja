-- 011: journal posts, info pages and size guide for the new storefront pages.

-- Replace the generic sample blog with Lovfoot journal posts (old ones archived, not deleted).
update public.blogs set status = 'archived';
insert into public.blog_categories (name, slug, status, sort_order) values
  ('Field Notes', 'field-notes', 'published', 1), ('Craft', 'craft', 'published', 2), ('Care', 'care-guides', 'published', 3)
on conflict (slug) do update set status = 'published';

insert into public.blogs (title, slug, excerpt, content_md, cover_image_url, author_name, category_id, status, published_at, sort_order)
select v.title, v.slug, v.excerpt, v.body, v.cover, 'Lovfoot Atelier', bc.id, 'published', now() - (v.days || ' days')::interval, v.ord
from (values
  ('Choosing a Trail Shoe for Uneven Ground', 'choosing-a-trail-shoe', 'Drop, stack and plate: what actually matters off the pavement.', E'# Choosing a trail shoe\n\nStart with the **terrain**. Loose rock wants a stiffer plate; packed earth rewards softer foam.\n\n## Drop\nA 6–8mm drop suits most walkers. Lower drops ask more of your calves.\n\n## Fit\n- Leave a thumb''s width at the toe.\n- Try shoes on in the evening, when feet are largest.\n- Walk downhill in the shop if you can.', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1664&auto=format&fit=crop', 'field-notes', 4, 1),
  ('Inside the Carbon Plate', 'inside-the-carbon-plate', 'How a thin sheet of carbon fibre changes the way a shoe returns energy.', E'# Inside the carbon plate\n\nThe plate sits between two layers of **adaptive foam**. It stiffens the forefoot so energy that would be lost in flex is returned at toe-off.\n\n## Why the angle matters\nToo steep and the shoe feels harsh; too flat and you lose the effect. We tune every plate per size run.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop', 'craft', 12, 2),
  ('How to Care for Knit and Suede', 'caring-for-knit-and-suede', 'Five minutes after every wear keeps them looking new.', E'# Caring for knit and suede\n\n1. Brush off dry dirt with a soft brush.\n2. Spot-clean knit with cool water and mild soap.\n3. Never machine-wash suede.\n4. Stuff with paper and dry away from direct heat.', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1064&auto=format&fit=crop', 'care-guides', 20, 3)
) as v(title, slug, excerpt, body, cover, cat, days, ord)
join public.blog_categories bc on bc.slug = v.cat
on conflict (slug) do update set status = 'published';

insert into public.pages (title, slug, content_md, status, sort_order) values
  ('About Lovfoot', 'about', E'# About Lovfoot\n\nLovfoot was founded in 2019 by industrial designers and trail runners who were tired of choosing between performance and aesthetics.\n\nEvery pair is designed in our atelier and assembled by hand in small batches. We believe in fewer, better things made to last.', 'published', 1),
  ('Shipping & Returns', 'shipping-returns', E'# Shipping & Returns\n\n## Delivery\nOrders are dispatched within **2 business days**. Delivery within Nairobi takes 1–2 days; elsewhere in Kenya 2–5 days.\n\n## Payment\nWe accept M-Pesa. You will receive a prompt on your phone at checkout.\n\n## Returns\nUnworn pairs in their original box can be returned within **30 days** for a full refund. Contact us with your order number to start a return.', 'published', 2)
on conflict (slug) do update set status = 'published', content_md = excluded.content_md, title = excluded.title;

insert into public.site_settings (key, value, description) values
  ('size_guide', '{"note":"Measure your foot from heel to longest toe in the evening. If you are between sizes, size up.","rows":[{"us":"US 5","eu":"EU 37.5","uk":"UK 4","cm":"23.0"},{"us":"US 6","eu":"EU 39","uk":"UK 5","cm":"24.0"},{"us":"US 7","eu":"EU 40","uk":"UK 6","cm":"25.0"},{"us":"US 8","eu":"EU 41","uk":"UK 7","cm":"26.0"},{"us":"US 9","eu":"EU 42.5","uk":"UK 8","cm":"27.0"},{"us":"US 10","eu":"EU 44","uk":"UK 9","cm":"28.0"},{"us":"US 11","eu":"EU 45","uk":"UK 10","cm":"29.0"},{"us":"US 12","eu":"EU 46","uk":"UK 11","cm":"30.0"}]}', 'Size chart shown on product pages'),
  ('journal', '{"eyebrow":"Journal","title":"Field Notes","subtitle":"Guides, craft stories and care tips from the atelier."}', 'Journal page heading'),
  ('faq_page', '{"eyebrow":"Help","title":"Frequently Asked","subtitle":"Quick answers about orders, payment and sizing."}', 'FAQ page heading')
on conflict (key) do nothing;

update public.faqs set status = 'archived';
insert into public.faqs (question, answer, category, status, sort_order) values
  ('How do I pay?', 'Add items to your cart and use Quick Checkout. Enter your M-Pesa number and approve the prompt on your phone.', 'payments', 'published', 1),
  ('How long does delivery take?', 'Orders are dispatched within 2 business days. Nairobi deliveries take 1–2 days, the rest of Kenya 2–5 days.', 'shipping', 'published', 2),
  ('Can I track my order?', 'Yes. Use Track Order with your order number and the phone number you paid with.', 'orders', 'published', 3),
  ('What is your return policy?', 'Unworn pairs can be returned within 30 days for a full refund.', 'returns', 'published', 4),
  ('How do I find my size?', 'Open the size guide on any product page. If you are between sizes, size up.', 'sizing', 'published', 5),
  ('Can I order a custom pair?', 'Yes — use the Custom Order tab on the Contact page. Lead time is 6–8 weeks.', 'custom', 'published', 6);
