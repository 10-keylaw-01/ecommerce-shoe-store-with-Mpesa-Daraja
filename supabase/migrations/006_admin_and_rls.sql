-- 006: admin tables + Row Level Security for every table.

create table public.admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'editor' check (role in ('owner','admin','editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.admin_users is 'Who may use the admin dashboard. A row here == admin (see is_admin()). Only owners can edit it.';

create table public.admin_activity_log (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.admin_users(id) on delete set null,
  table_name text not null,
  record_id  text not null default '',
  action     text not null check (action in ('INSERT','UPDATE','DELETE')),
  diff       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.admin_activity_log is 'Audit trail of admin edits to content tables, written by log_admin_activity().';
create index admin_activity_log_admin_id_idx on public.admin_activity_log (admin_id);
create index admin_activity_log_table_idx    on public.admin_activity_log (table_name, record_id);
create index admin_activity_log_created_idx  on public.admin_activity_log (created_at desc);

select public.attach_standard_triggers('public.admin_users');
select public.attach_standard_triggers('public.admin_activity_log');

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere + admin full-access policy
-- (admin_users and admin_activity_log get bespoke policies below)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','brands','products','product_variants','product_images',
    'customers','addresses','orders','order_items','order_status_history',
    'contact_requests','custom_requests','newsletter_subscribers','reviews',
    'blog_categories','blogs','pages','banners','faqs','site_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "admin full access" on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.admin_users        enable row level security;
alter table public.admin_activity_log enable row level security;

-- admin_users: admins read all, anyone signed in reads their own row, owners write.
create policy "read own or admin" on public.admin_users for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "owner manages" on public.admin_users for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- activity log: admins read; rows are written only by the SECURITY DEFINER trigger.
create policy "admin read" on public.admin_activity_log for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public site: read published content
-- ---------------------------------------------------------------------------
create policy "public read published" on public.categories      for select to anon, authenticated using (status = 'published');
create policy "public read published" on public.brands          for select to anon, authenticated using (status = 'published');
create policy "public read published" on public.blog_categories for select to anon, authenticated using (status = 'published');
create policy "public read published" on public.blogs           for select to anon, authenticated using (status = 'published');
create policy "public read published" on public.pages           for select to anon, authenticated using (status = 'published');
create policy "public read published" on public.faqs            for select to anon, authenticated using (status = 'published');
create policy "public read published" on public.products        for select to anon, authenticated using (status = 'published');

create policy "public read published" on public.banners for select to anon, authenticated
  using (status = 'published' and starts_at <= now() and (ends_at is null or ends_at > now()));

-- Children follow the parent product's visibility.
create policy "public read published" on public.product_variants for select to anon, authenticated
  using (status = 'published' and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "public read published" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "public read published" on public.reviews for select to anon, authenticated
  using (status = 'published');

-- No status column on site_settings: all keys are public. Do NOT store secrets there.
create policy "public read" on public.site_settings for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Public site: insert-only forms
-- ---------------------------------------------------------------------------
-- NOTE: with insert-only access, do not chain .select() on these inserts from the client.
create policy "public submit" on public.contact_requests for insert to anon, authenticated
  with check (status = 'new');
create policy "public submit" on public.custom_requests for insert to anon, authenticated
  with check (status = 'new' and (customer_id is null or customer_id = (select auth.uid())));
create policy "public subscribe" on public.newsletter_subscribers for insert to anon, authenticated
  with check (status = 'active');
create policy "public submit" on public.reviews for insert to anon, authenticated
  with check (status = 'draft' and (customer_id is null or customer_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Signed-in customers: their own data
-- ---------------------------------------------------------------------------
create policy "own row read"   on public.customers for select to authenticated using (id = (select auth.uid()));
create policy "own row update" on public.customers for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own addresses" on public.addresses for all to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));

create policy "own orders read" on public.orders for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "own order items read" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and o.customer_id = (select auth.uid())));

create policy "own reviews read" on public.reviews for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "own custom requests read" on public.custom_requests for select to authenticated
  using (customer_id = (select auth.uid()));
