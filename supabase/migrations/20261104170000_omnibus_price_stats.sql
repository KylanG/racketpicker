-- RP-41: MSRP and Omnibus price statistics.
--
-- Omnibus Directive: a discount ("-X%", struck-through price) is always measured against
-- the lowest price of the 30 days *before* today, never against an MSRP. The MSRP may
-- only be shown with the label "adviesprijs".

-- 1. MSRP (adviesprijs). Optional; EUR for all current markets.
alter table public.products
  add column msrp numeric(10, 2) check (msrp >= 0);

comment on column public.products.msrp is
  'Manufacturer''s suggested retail price (adviesprijs). Only shown with that label, never as the basis for a discount.';

-- 2. Price statistics per product per market.
--
-- A function rather than a view: it reads the history of *all* offers of a published
-- product, including offers that are no longer active. Their older, lower prices count
-- towards the 30-day low, so a discount is never overstated. anon cannot see inactive
-- offers through RLS, hence security definer; it only returns aggregates of published
-- products.
--
-- Days are calendar days in UTC (current_date of the database), the same day the daily
-- import records its snapshot.
create or replace function public.product_price_stats(p_market_code text)
returns table (
  product_id uuid,
  market_code text,
  -- Lowest price of active offers at active shops right now.
  current_price numeric,
  -- Lowest daily price of the 30 days before today (basis for "-X%" and the struck-through price).
  lowest_30d numeric,
  -- Lowest daily price of the last 90 days, today included (for "laagste prijs in 90 dagen").
  lowest_90d numeric,
  avg_90d numeric,
  highest_90d numeric,
  -- First day with any recorded price; decides whether there is enough history.
  first_recorded_on date,
  msrp numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with current_prices as (
    select o.product_id, min(o.price) as current_price
    from public.offers o
    join public.shops s on s.id = o.shop_id and s.is_active
    where o.is_active and o.market_code = p_market_code
    group by o.product_id
  ),
  daily as (
    -- Lowest price across all shops per product per day.
    select o.product_id, ph.recorded_on, min(ph.price) as price
    from public.price_history ph
    join public.offers o on o.id = ph.offer_id
    where o.market_code = p_market_code
      and ph.recorded_on > current_date - 90
    group by o.product_id, ph.recorded_on
  ),
  first_seen as (
    select o.product_id, min(ph.recorded_on) as first_recorded_on
    from public.price_history ph
    join public.offers o on o.id = ph.offer_id
    where o.market_code = p_market_code
    group by o.product_id
  )
  select
    p.id,
    p_market_code,
    cp.current_price,
    min(d.price) filter (where d.recorded_on >= current_date - 30 and d.recorded_on < current_date),
    min(d.price),
    round(avg(d.price), 2),
    max(d.price),
    fs.first_recorded_on,
    p.msrp
  from public.products p
  join current_prices cp on cp.product_id = p.id
  left join daily d on d.product_id = p.id
  left join first_seen fs on fs.product_id = p.id
  where p.status = 'published'
  group by p.id, cp.current_price, fs.first_recorded_on, p.msrp;
$$;

comment on function public.product_price_stats(text) is
  'Omnibus price statistics per published product for one market (RP-41).';

revoke all on function public.product_price_stats(text) from public;
grant execute on function public.product_price_stats(text) to anon, authenticated, service_role;
