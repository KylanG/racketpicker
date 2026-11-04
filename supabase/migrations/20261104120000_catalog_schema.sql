-- RP-14: catalog schema (products, brands, shops, offers, price history).
-- Conventions:
--   * Prices in EUR incl. VAT as numeric(10,2); shipping separate.
--   * Product data (specs, scores) is shared across markets; text content and offers are per market.
--   * Every table has RLS. Tables are not auto-exposed: anon/authenticated get explicit SELECT only.
--   * Writes happen server-side with the secret key (feed imports, admin), which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.product_status as enum ('draft', 'published', 'archived');
-- A = editorial + own test, B = data blocks only, C = thin (noindex)
create type public.content_tier as enum ('A', 'B', 'C');
create type public.racket_shape as enum ('round', 'teardrop', 'diamond', 'hybrid');
create type public.racket_balance as enum ('low', 'medium', 'high');
create type public.play_level as enum ('beginner', 'intermediate', 'advanced', 'pro');
create type public.play_style as enum ('control', 'all_round', 'power');
create type public.score_source as enum ('specs', 'test', 'editorial');
create type public.affiliate_network as enum ('daisycon', 'awin', 'direct', 'other');
create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock', 'preorder', 'unknown');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table public.sports (
  key text primary key check (key ~ '^[a-z][a-z_-]*$'),
  sort_order smallint not null default 0
);

create table public.categories (
  key text primary key check (key ~ '^[a-z][a-z_-]*$'),
  sport_key text not null references public.sports (key),
  sort_order smallint not null default 0
);
create index categories_sport_key_idx on public.categories (sport_key);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger brands_set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id),
  category_key text not null references public.categories (key),
  model text not null,
  model_year smallint check (model_year between 2000 and 2100),
  -- EAN/GTIN codes across sizes/colours; used for matching feed items (RP-18)
  gtins text[] not null default '{}',
  tier public.content_tier not null default 'C',
  status public.product_status not null default 'draft',
  -- Example data for development; filtered out in production by the app
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, model, model_year)
);
create index products_category_status_idx on public.products (category_key, status);
create index products_gtins_idx on public.products using gin (gtins);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.racket_specs (
  product_id uuid primary key references public.products (id) on delete cascade,
  shape public.racket_shape,
  weight_min_g smallint check (weight_min_g between 250 and 450),
  weight_max_g smallint check (weight_max_g between 250 and 450),
  balance public.racket_balance,
  balance_mm smallint check (balance_mm between 200 and 320),
  core_material text,          -- e.g. 'EVA Soft', 'EVA Hard', 'Foam'
  face_material text,          -- e.g. 'Carbon 3K', 'Carbon 18K', 'Fiberglass'
  frame_material text,
  surface_texture text,        -- e.g. 'smooth', 'sand', '3D'
  thickness_mm numeric(4, 1) check (thickness_mm between 30 and 45),
  levels public.play_level[] not null default '{}',
  play_style public.play_style,
  updated_at timestamptz not null default now(),
  check (weight_min_g is null or weight_max_g is null or weight_min_g <= weight_max_g)
);
create index racket_specs_shape_idx on public.racket_specs (shape);
create index racket_specs_levels_idx on public.racket_specs using gin (levels);
create trigger racket_specs_set_updated_at before update on public.racket_specs
  for each row execute function public.set_updated_at();

-- Scores 0-100. Never invented: source says where each set comes from.
create table public.product_scores (
  product_id uuid primary key references public.products (id) on delete cascade,
  power smallint check (power between 0 and 100),
  control smallint check (control between 0 and 100),
  sweet_spot smallint check (sweet_spot between 0 and 100),
  maneuverability smallint check (maneuverability between 0 and 100),
  comfort smallint check (comfort between 0 and 100),
  source public.score_source not null,
  method_note text,
  updated_at timestamptz not null default now()
);
create trigger product_scores_set_updated_at before update on public.product_scores
  for each row execute function public.set_updated_at();

-- Text content per market (nl, es). Slugs are unique per market.
create table public.product_content (
  product_id uuid not null references public.products (id) on delete cascade,
  market_code text not null references public.markets (code),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  seo_title text,
  seo_description text,
  intro text,
  strengths text[] not null default '{}',   -- "Sterk in"
  watch_outs text[] not null default '{}',  -- "Let op"
  ideal_for text,                           -- "Ideaal voor"
  faq jsonb not null default '[]' check (jsonb_typeof(faq) = 'array'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, market_code),
  unique (market_code, slug)
);
create trigger product_content_set_updated_at before update on public.product_content
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,   -- path in Supabase Storage (RP-19)
  alt text,
  width smallint,
  height smallint,
  position smallint not null default 0,
  source_url text,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------------------
-- Shops, offers, price history
-- ---------------------------------------------------------------------------
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  market_code text not null references public.markets (code),
  network public.affiliate_network not null,
  network_advertiser_id text,
  website_url text,
  logo_path text,
  shipping_info text,
  free_shipping_from numeric(10, 2) check (free_shipping_from >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shops_market_idx on public.shops (market_code);
create trigger shops_set_updated_at before update on public.shops
  for each row execute function public.set_updated_at();

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  market_code text not null references public.markets (code),
  external_id text not null,          -- shop SKU / feed item id
  gtin text,
  feed_title text,                    -- raw title from the feed, for matching review
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  shipping_cost numeric(10, 2) check (shipping_cost >= 0),
  stock_status public.stock_status not null default 'unknown',
  delivery_days_min smallint check (delivery_days_min >= 0),
  delivery_days_max smallint check (delivery_days_max >= 0),
  affiliate_url text not null,
  product_url text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, external_id),
  check (delivery_days_min is null or delivery_days_max is null or delivery_days_min <= delivery_days_max)
);
create index offers_product_market_active_idx on public.offers (product_id, market_code) where is_active;
create index offers_shop_idx on public.offers (shop_id);
create index offers_market_idx on public.offers (market_code);
create trigger offers_set_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

-- One snapshot per offer per day (RP-19).
create table public.price_history (
  offer_id uuid not null references public.offers (id) on delete cascade,
  recorded_on date not null default current_date,
  price numeric(10, 2) not null check (price >= 0),
  shipping_cost numeric(10, 2) check (shipping_cost >= 0),
  stock_status public.stock_status not null,
  primary key (offer_id, recorded_on)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: public may read only what is live.
-- ---------------------------------------------------------------------------
alter table public.sports enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.racket_specs enable row level security;
alter table public.product_scores enable row level security;
alter table public.product_content enable row level security;
alter table public.product_images enable row level security;
alter table public.shops enable row level security;
alter table public.offers enable row level security;
alter table public.price_history enable row level security;

grant select on
  public.sports, public.categories, public.brands, public.products, public.racket_specs,
  public.product_scores, public.product_content, public.product_images, public.shops,
  public.offers, public.price_history
to anon, authenticated;

create policy "Sports are public" on public.sports
  for select to anon, authenticated using (true);

create policy "Categories are public" on public.categories
  for select to anon, authenticated using (true);

create policy "Brands are public" on public.brands
  for select to anon, authenticated using (true);

create policy "Published products are public" on public.products
  for select to anon, authenticated using (status = 'published');

create policy "Specs of published products are public" on public.racket_specs
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "Scores of published products are public" on public.product_scores
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "Published content of published products is public" on public.product_content
  for select to anon, authenticated
  using (
    is_published
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );

create policy "Images of published products are public" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "Active shops are public" on public.shops
  for select to anon, authenticated using (is_active);

create policy "Active offers of published products at active shops are public" on public.offers
  for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
    and exists (select 1 from public.shops s where s.id = shop_id and s.is_active)
  );

create policy "Price history of visible offers is public" on public.price_history
  for select to anon, authenticated
  using (exists (select 1 from public.offers o where o.id = offer_id));

-- ---------------------------------------------------------------------------
-- Lowest price per product per market, for product cards and the buy box.
-- security_invoker: the caller's RLS applies, so only visible offers count.
-- ---------------------------------------------------------------------------
create view public.product_price_summary
with (security_invoker = true) as
select
  o.product_id,
  o.market_code,
  min(o.price) as lowest_price,
  min(o.price + coalesce(o.shipping_cost, 0)) as lowest_total_price,
  count(*)::int as offer_count,
  count(*) filter (where o.stock_status in ('in_stock', 'low_stock'))::int as in_stock_count,
  max(o.updated_at) as last_updated_at
from public.offers o
where o.is_active
group by o.product_id, o.market_code;

grant select on public.product_price_summary to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
insert into public.sports (key, sort_order) values ('padel', 1), ('tennis', 2);

insert into public.categories (key, sport_key, sort_order) values
  ('padel-rackets', 'padel', 1),
  ('padel-shoes', 'padel', 2),
  ('padel-bags', 'padel', 3),
  ('padel-balls', 'padel', 4);
