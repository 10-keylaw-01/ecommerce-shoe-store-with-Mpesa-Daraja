-- 004: visitor/customer submissions.

create table public.contact_requests (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null default '',
  message    text not null,
  status     text not null default 'new' check (status in ('new','in_progress','resolved','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.contact_requests is 'Messages from the public contact form. Anon may insert only.';
create index contact_requests_status_idx on public.contact_requests (status);

create table public.custom_requests (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid references public.customers(id) on delete set null,
  name                text not null,
  email               text not null,
  product_description text not null,
  size                text not null default '',
  budget_range        text not null default '',
  message             text not null default '',
  status              text not null default 'new' check (status in ('new','in_progress','quoted','completed','declined')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table public.custom_requests is 'Bespoke / made-to-order shoe requests. Anon may insert only.';
create index custom_requests_customer_id_idx on public.custom_requests (customer_id);
create index custom_requests_status_idx      on public.custom_requests (status);

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  status     text not null default 'active' check (status in ('active','unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.newsletter_subscribers is 'Email newsletter list. Anon may insert only.';
create index newsletter_subscribers_status_idx on public.newsletter_subscribers (status);

-- customer_id is nullable and reviewer_name added (deviation from spec) so that
-- anonymous visitors can leave reviews, which are held as 'draft' until an admin publishes them.
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  reviewer_name text not null default '',
  rating        int  not null check (rating between 1 and 5),
  title         text not null default '',
  body          text not null default '',
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, customer_id)
);
comment on table public.reviews is 'Product reviews. Submitted as draft; shown publicly only once published by an admin.';
create index reviews_product_id_idx  on public.reviews (product_id);
create index reviews_customer_id_idx on public.reviews (customer_id);
create index reviews_status_idx      on public.reviews (status);

select public.attach_standard_triggers('public.contact_requests');
select public.attach_standard_triggers('public.custom_requests');
select public.attach_standard_triggers('public.newsletter_subscribers');
select public.attach_standard_triggers('public.reviews', true);
