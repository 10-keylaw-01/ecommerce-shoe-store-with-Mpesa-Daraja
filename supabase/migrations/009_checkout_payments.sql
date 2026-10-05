-- 009: guest checkout, M-Pesa payments, product badge/specs.

-- Products: badge ("Limited Edition") and free-form technical specs shown on the product page.
alter table public.products
  add column if not exists badge text not null default '',
  add column if not exists specs jsonb not null default '{}'::jsonb;

-- Orders: allow guest checkout (no auth user) and keep the buyer's details on the order.
alter table public.orders alter column customer_id drop not null;
alter table public.orders
  add column if not exists guest_name     text not null default '',
  add column if not exists guest_email    text not null default '',
  add column if not exists guest_phone    text not null default '',
  add column if not exists payment_method text not null default '',
  add column if not exists paid_at        timestamptz,
  add column if not exists notes          text not null default '';

-- Payments: one row per STK push attempt. Written only by the checkout server (service role).
create table if not exists public.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  provider            text not null default 'mpesa',
  phone               text not null,
  amount              numeric(12,2) not null check (amount > 0),
  currency            text not null default 'KES',
  merchant_request_id text not null default '',
  checkout_request_id text not null unique,
  status              text not null default 'pending'
                      check (status in ('pending','success','failed','cancelled','timeout')),
  mpesa_receipt       text not null default '',
  result_code         int,
  result_desc         text not null default '',
  raw_callback        jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table public.payments is 'M-Pesa STK push attempts for orders. Server-written; admins read.';
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_idx   on public.payments (status);
select public.attach_standard_triggers('public.payments');

alter table public.payments enable row level security;
drop policy if exists "admin full access" on public.payments;
create policy "admin full access" on public.payments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Atomically mark an order paid and take its items out of stock. Idempotent.
create or replace function public.mark_order_paid(p_order uuid, p_method text default 'mpesa')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_status text;
begin
  select status into v_status from public.orders where id = p_order for update;
  if v_status is distinct from 'pending' then return false; end if;

  update public.product_variants v
     set stock = greatest(v.stock - i.qty, 0)
    from public.order_items i
   where i.order_id = p_order and i.variant_id = v.id;

  update public.orders
     set status = 'paid', paid_at = now(), payment_method = p_method
   where id = p_order;
  return true;
end;
$$;
revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant  execute on function public.mark_order_paid(uuid, text) to service_role;
