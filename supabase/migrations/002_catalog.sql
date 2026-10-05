-- 002: catalog (what the shop sells).

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  image_url   text not null default '',
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.categories is 'Product categories shown in navigation and category pages.';
create index categories_status_idx on public.categories (status);

create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_url    text not null default '',
  description text not null default '',
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.brands is 'Shoe brands/labels that products belong to.';
create index brands_status_idx on public.brands (status);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description       text not null default '',
  short_description text not null default '',
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  brand_id          uuid not null references public.brands(id) on delete restrict,
  category_id       uuid not null references public.categories(id) on delete restrict,
  gender            text not null default 'unisex' check (gender in ('men','women','unisex','kids')),
  status            text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order        int  not null default 0,
  is_featured       boolean not null default false,
  tags              text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.products is 'Sellable shoe models. Sizes/colours/stock live in product_variants.';
create index products_brand_id_idx    on public.products (brand_id);
create index products_category_id_idx on public.products (category_id);
create index products_status_idx      on public.products (status);
create index products_featured_idx    on public.products (is_featured) where is_featured;
create index products_tags_idx        on public.products using gin (tags);

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  size           text not null,
  color          text not null default '',
  sku            text not null unique,
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  stock          int  not null default 0 check (stock >= 0),
  status         text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_id, size, color)
);
comment on table public.product_variants is 'Purchasable size/colour combinations of a product, with stock and optional price override.';
create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_variants_status_idx     on public.product_variants (status);

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  alt_text   text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.product_images is 'Gallery images for a product. Visibility follows the parent product status.';
create index product_images_product_id_idx on public.product_images (product_id);

select public.attach_standard_triggers('public.categories',       true);
select public.attach_standard_triggers('public.brands',           true);
select public.attach_standard_triggers('public.products',         true);
select public.attach_standard_triggers('public.product_variants', true);
select public.attach_standard_triggers('public.product_images',   true);
