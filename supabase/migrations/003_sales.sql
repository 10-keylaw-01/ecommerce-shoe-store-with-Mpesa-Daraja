-- 003: customers and orders.

create table public.customers (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  phone      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.customers is 'Shopper profile; id equals auth.users.id. Auto-created on sign-up by handle_new_user().';
create index customers_email_idx on public.customers (email);

-- Auto-create a customers row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customers (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  line1       text not null,
  line2       text not null default '',
  city        text not null,
  state       text not null default '',
  postal_code text not null,
  country     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.addresses is 'Saved shipping addresses for customers (one default per customer).';
create index addresses_customer_id_idx on public.addresses (customer_id);
create unique index addresses_one_default_idx on public.addresses (customer_id) where is_default;

create sequence public.order_number_seq start 1001;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references public.customers(id) on delete restrict,
  order_number     text not null unique
                   default ('ORD-' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  status           text not null default 'pending'
                   check (status in ('pending','paid','shipped','delivered','cancelled','refunded')),
  subtotal         numeric(10,2) not null default 0 check (subtotal >= 0),
  shipping         numeric(10,2) not null default 0 check (shipping >= 0),
  total            numeric(10,2) not null default 0 check (total >= 0),
  currency         text not null default 'USD' check (char_length(currency) = 3),
  shipping_address jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (total = subtotal + shipping)
);
comment on table public.orders is 'Customer orders. Created server-side (checkout function/service role); customers read-only.';
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx      on public.orders (status);
create index orders_created_at_idx  on public.orders (created_at desc);

create table public.order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders(id) on delete cascade,
  variant_id            uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_label_snapshot text not null default '',
  qty                   int not null check (qty > 0),
  unit_price            numeric(10,2) not null check (unit_price >= 0),
  line_total            numeric(10,2) not null check (line_total >= 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (line_total = qty * unit_price)
);
comment on table public.order_items is 'Line items of an order; names/prices are snapshots so history survives catalog edits.';
create index order_items_order_id_idx   on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status   text not null,
  note        text not null default '',
  changed_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.order_status_history is 'Append-only timeline of order status changes, written by trigger on orders.';
create index order_status_history_order_id_idx on public.order_status_history (order_id);

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

create trigger orders_status_history
  after insert or update on public.orders
  for each row execute function public.log_order_status_change();

select public.attach_standard_triggers('public.customers');
select public.attach_standard_triggers('public.addresses');
select public.attach_standard_triggers('public.orders');
select public.attach_standard_triggers('public.order_items');
select public.attach_standard_triggers('public.order_status_history');
