-- RP-16/17/18: affiliate feed import.
-- feed_sources: which shop feed to import and how (URL itself lives in an env var).
-- feed_items:   every relevant feed row, matched to a product or waiting for review.
-- import_runs:  one row per import, with counts and errors.
-- ingest_feed_items(): applies one parsed feed in a single transaction.
-- None of these tables are public: no grants to anon/authenticated. Only the server
-- (secret key, service_role) reads and writes them.

create type public.feed_format as enum ('csv', 'csv_gz');
-- 'all': every row is relevant (padel-only shop). 'padel_rackets': keep only padel rackets.
create type public.feed_filter as enum ('all', 'padel_rackets');
create type public.match_status as enum ('matched', 'pending', 'rejected');
create type public.match_method as enum ('gtin', 'name', 'manual');
create type public.import_status as enum ('running', 'succeeded', 'failed');

create table public.feed_sources (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique references public.shops (id) on delete cascade,
  network public.affiliate_network not null,
  -- Key in the env var map (DAISYCON_FEED_URLS / AWIN_FEED_URLS) holding the feed URL
  feed_key text not null,
  format public.feed_format not null default 'csv',
  filter public.feed_filter not null default 'padel_rackets',
  is_active boolean not null default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger feed_sources_set_updated_at before update on public.feed_sources
  for each row execute function public.set_updated_at();

create table public.feed_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  external_id text not null,
  title text not null,
  brand text,
  gtin text,
  category text,
  price numeric(10, 2) not null check (price >= 0),
  shipping_cost numeric(10, 2) check (shipping_cost >= 0),
  stock_status public.stock_status not null default 'unknown',
  delivery_days_min smallint,
  delivery_days_max smallint,
  product_url text,
  affiliate_url text not null,
  image_url text,
  match_status public.match_status not null default 'pending',
  match_method public.match_method,
  matched_product_id uuid references public.products (id) on delete set null,
  -- Best candidate for review when not matched automatically
  suggested_product_id uuid references public.products (id) on delete set null,
  match_score numeric(4, 3),
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, external_id)
);
create index feed_items_review_idx on public.feed_items (match_status) where match_status = 'pending';
create index feed_items_gtin_idx on public.feed_items (gtin) where gtin is not null;
create index feed_items_matched_product_idx on public.feed_items (matched_product_id);
create index feed_items_suggested_product_idx on public.feed_items (suggested_product_id);
create trigger feed_items_set_updated_at before update on public.feed_items
  for each row execute function public.set_updated_at();

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  status public.import_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}',
  error text
);
create index import_runs_shop_started_idx on public.import_runs (shop_id, started_at desc);

alter table public.feed_sources enable row level security;
alter table public.feed_items enable row level security;
alter table public.import_runs enable row level security;
-- Deliberately no policies and no grants: server-only tables.

-- ---------------------------------------------------------------------------
-- ingest_feed_items(shop, items)
-- items: jsonb array of normalized rows from the app, each with
--   external_id, title, brand, gtin, category, price, shipping_cost, stock_status,
--   delivery_days_min, delivery_days_max, product_url, affiliate_url, image_url,
--   match_status, match_method, matched_product_id, suggested_product_id, match_score
-- Rules:
--   * Manual decisions (match_method = 'manual' or status 'rejected') are never overwritten.
--   * Matched items become active offers; offers of this shop not in the feed are deactivated.
--   * One price_history snapshot per offer per day (last import of the day wins).
-- ---------------------------------------------------------------------------
create function public.ingest_feed_items(p_shop_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_market text;
  v_now timestamptz := now();
  v_stats jsonb;
begin
  select market_code into v_market from public.shops where id = p_shop_id;
  if v_market is null then
    raise exception 'Unknown shop %', p_shop_id;
  end if;

  drop table if exists pg_temp.incoming;
  create temporary table incoming on commit drop as
  select *
  from jsonb_to_recordset(p_items) as x(
    external_id text, title text, brand text, gtin text, category text,
    price numeric, shipping_cost numeric, stock_status public.stock_status,
    delivery_days_min smallint, delivery_days_max smallint,
    product_url text, affiliate_url text, image_url text,
    match_status public.match_status, match_method public.match_method,
    matched_product_id uuid, suggested_product_id uuid, match_score numeric
  );

  -- 1. Upsert feed items; keep manual decisions.
  insert into public.feed_items as fi (
    shop_id, external_id, title, brand, gtin, category, price, shipping_cost, stock_status,
    delivery_days_min, delivery_days_max, product_url, affiliate_url, image_url,
    match_status, match_method, matched_product_id, suggested_product_id, match_score,
    is_active, last_seen_at
  )
  select
    p_shop_id, i.external_id, i.title, i.brand, i.gtin, i.category, i.price, i.shipping_cost,
    coalesce(i.stock_status, 'unknown'), i.delivery_days_min, i.delivery_days_max,
    i.product_url, i.affiliate_url, i.image_url,
    coalesce(i.match_status, 'pending'), i.match_method, i.matched_product_id,
    i.suggested_product_id, i.match_score, true, v_now
  from incoming i
  on conflict (shop_id, external_id) do update set
    title = excluded.title, brand = excluded.brand, gtin = excluded.gtin,
    category = excluded.category, price = excluded.price, shipping_cost = excluded.shipping_cost,
    stock_status = excluded.stock_status, delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max, product_url = excluded.product_url,
    affiliate_url = excluded.affiliate_url, image_url = excluded.image_url,
    is_active = true, last_seen_at = v_now,
    match_status = case when fi.match_method = 'manual' or fi.match_status = 'rejected'
      then fi.match_status else excluded.match_status end,
    match_method = case when fi.match_method = 'manual' or fi.match_status = 'rejected'
      then fi.match_method else excluded.match_method end,
    matched_product_id = case when fi.match_method = 'manual' or fi.match_status = 'rejected'
      then fi.matched_product_id else excluded.matched_product_id end,
    suggested_product_id = case when fi.match_method = 'manual' or fi.match_status = 'rejected'
      then fi.suggested_product_id else excluded.suggested_product_id end,
    match_score = case when fi.match_method = 'manual' or fi.match_status = 'rejected'
      then fi.match_score else excluded.match_score end;

  -- 2. Items of this shop that disappeared from the feed.
  update public.feed_items
  set is_active = false
  where shop_id = p_shop_id and is_active and last_seen_at < v_now;

  -- 3. Matched + active items become offers.
  insert into public.offers as o (
    product_id, shop_id, market_code, external_id, gtin, feed_title, price, shipping_cost,
    stock_status, delivery_days_min, delivery_days_max, affiliate_url, product_url,
    is_active, last_seen_at
  )
  select
    fi.matched_product_id, p_shop_id, v_market, fi.external_id, fi.gtin, fi.title, fi.price,
    fi.shipping_cost, fi.stock_status, fi.delivery_days_min, fi.delivery_days_max,
    fi.affiliate_url, fi.product_url, true, v_now
  from public.feed_items fi
  where fi.shop_id = p_shop_id and fi.is_active
    and fi.match_status = 'matched' and fi.matched_product_id is not null
  on conflict (shop_id, external_id) do update set
    product_id = excluded.product_id, gtin = excluded.gtin, feed_title = excluded.feed_title,
    price = excluded.price, shipping_cost = excluded.shipping_cost,
    stock_status = excluded.stock_status, delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max, affiliate_url = excluded.affiliate_url,
    product_url = excluded.product_url, is_active = true, last_seen_at = v_now;

  -- 4. Offers of this shop that are no longer matched/active in the feed.
  --    Sample offers (seed data) are left alone.
  update public.offers o
  set is_active = false
  where o.shop_id = p_shop_id and o.is_active and o.last_seen_at < v_now
    and not exists (select 1 from public.products p where p.id = o.product_id and p.is_sample);

  -- 5. Daily price snapshot for active offers of this shop.
  insert into public.price_history (offer_id, recorded_on, price, shipping_cost, stock_status)
  select o.id, (v_now at time zone 'Europe/Amsterdam')::date, o.price, o.shipping_cost, o.stock_status
  from public.offers o
  where o.shop_id = p_shop_id and o.is_active and o.last_seen_at = v_now
  on conflict (offer_id, recorded_on) do update set
    price = excluded.price, shipping_cost = excluded.shipping_cost,
    stock_status = excluded.stock_status;

  update public.feed_sources set last_run_at = v_now where shop_id = p_shop_id;

  select jsonb_build_object(
    'received', (select count(*) from incoming),
    'matched', (select count(*) from public.feed_items
                where shop_id = p_shop_id and is_active and match_status = 'matched'),
    'pending', (select count(*) from public.feed_items
                where shop_id = p_shop_id and is_active and match_status = 'pending'),
    'rejected', (select count(*) from public.feed_items
                 where shop_id = p_shop_id and is_active and match_status = 'rejected'),
    'deactivated_items', (select count(*) from public.feed_items
                          where shop_id = p_shop_id and not is_active and last_seen_at < v_now),
    'active_offers', (select count(*) from public.offers where shop_id = p_shop_id and is_active)
  ) into v_stats;

  return v_stats;
end;
$$;

revoke execute on function public.ingest_feed_items(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_feed_items(uuid, jsonb) to service_role;
