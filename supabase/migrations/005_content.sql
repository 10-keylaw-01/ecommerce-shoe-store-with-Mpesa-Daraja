-- 005: editorial / marketing content managed from the admin dashboard.

create table public.blog_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status     text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.blog_categories is 'Topics used to group blog posts.';
create index blog_categories_status_idx on public.blog_categories (status);

create table public.blogs (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt         text not null default '',
  content_md      text not null default '',
  cover_image_url text not null default '',
  author_name     text not null default '',
  category_id     uuid references public.blog_categories(id) on delete set null,
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  published_at    timestamptz,
  sort_order      int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.blogs is 'Blog posts written in Markdown.';
create index blogs_category_id_idx  on public.blogs (category_id);
create index blogs_status_idx       on public.blogs (status);
create index blogs_published_at_idx on public.blogs (published_at desc);

create table public.pages (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content_md text not null default '',
  status     text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.pages is 'Static pages (About, Shipping, Privacy...) written in Markdown.';
create index pages_status_idx on public.pages (status);

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text not null default '',
  image_url  text not null default '',
  cta_text   text not null default '',
  cta_link   text not null default '',
  placement  text not null check (placement in ('home_hero','home_mid','category_top')),
  status     text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int  not null default 0,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
comment on table public.banners is 'Promotional banners per placement; shown while status=published and within starts_at/ends_at.';
create index banners_status_idx    on public.banners (status);
create index banners_placement_idx on public.banners (placement);

create table public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text not null default 'general',
  status     text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.faqs is 'Frequently asked questions, grouped by free-text category.';
create index faqs_status_idx on public.faqs (status);

-- Exception to the uuid convention: keyed by `key` so the site can look values up directly.
create table public.site_settings (
  key         text primary key check (key ~ '^[a-z0-9_]+$'),
  value       jsonb not null default 'null'::jsonb,
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.site_settings is 'Key/value site configuration (name, contact info, socials, flags). Publicly readable - never store secrets.';

select public.attach_standard_triggers('public.blog_categories', true);
select public.attach_standard_triggers('public.blogs',           true);
select public.attach_standard_triggers('public.pages',           true);
select public.attach_standard_triggers('public.banners',         true);
select public.attach_standard_triggers('public.faqs',            true);
select public.attach_standard_triggers('public.site_settings',   true);
