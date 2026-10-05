-- 007: public-read storage buckets, admin-only writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('blog-images',    'blog-images',    true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('banner-images',  'banner-images',  true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('site-assets',    'site-assets',    true, 5242880, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/x-icon'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "site buckets public read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('product-images','blog-images','banner-images','site-assets'));

create policy "site buckets admin insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','blog-images','banner-images','site-assets') and public.is_admin());
create policy "site buckets admin update" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','blog-images','banner-images','site-assets') and public.is_admin())
  with check (bucket_id in ('product-images','blog-images','banner-images','site-assets') and public.is_admin());
create policy "site buckets admin delete" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','blog-images','banner-images','site-assets') and public.is_admin());
