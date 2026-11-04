-- RP-41: measure a discount against the 30 days before the price *reduction*.
--
-- Omnibus Directive: the prior price is the lowest price applied in the 30 days before
-- the reduction. The first version compared with the 30 days before *today*, so the
-- days at the reduced price counted themselves and a discount vanished one day after it
-- started.
--
--   reduced_since  first day of the current price level: the day after the last day the
--                  daily low was higher than today's price (null if it never was)
--   prior_price    lowest daily price in the 30 days before reduced_since
--
-- Shown discount: current_price vs prior_price, only when the history covers those 30
-- days (first_recorded_on <= reduced_since - 30; checked in src/lib/catalog/pricing.ts).

drop function if exists public.product_price_stats(text);

create function public.product_price_stats(p_market_code text)
returns table (
  product_id uuid,
  market_code text,
  -- Lowest price of active offers at active shops right now.
  current_price numeric,
  reduced_since date,
  prior_price numeric,
  -- Lowest daily price of the last 90 days, today included (for "laagste prijs in 90 dagen").
  lowest_90d numeric,
  avg_90d numeric,
  highest_90d numeric,
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
    -- Lowest price across all shops per product per day, including offers that are no
    -- longer active: their lower prices count, so a discount is never overstated.
    select o.product_id, ph.recorded_on, min(ph.price) as price
    from public.price_history ph
    join public.offers o on o.id = ph.offer_id
    where o.market_code = p_market_code
      and ph.recorded_on > current_date - 400
    group by o.product_id, ph.recorded_on
  ),
  last_higher as (
    select d.product_id, max(d.recorded_on) as last_higher_on
    from daily d
    join current_prices cp on cp.product_id = d.product_id
    where d.price > cp.current_price and d.recorded_on < current_date
    group by d.product_id
  ),
  prior as (
    select lh.product_id, min(d.price) as prior_price
    from last_higher lh
    join daily d on d.product_id = lh.product_id
      and d.recorded_on between lh.last_higher_on - 29 and lh.last_higher_on
    group by lh.product_id
  ),
  stats_90 as (
    select product_id, min(price) as lowest, round(avg(price), 2) as avg, max(price) as highest
    from daily
    where recorded_on > current_date - 90
    group by product_id
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
    lh.last_higher_on + 1,
    pr.prior_price,
    s.lowest,
    s.avg,
    s.highest,
    fs.first_recorded_on,
    p.msrp
  from public.products p
  join current_prices cp on cp.product_id = p.id
  left join last_higher lh on lh.product_id = p.id
  left join prior pr on pr.product_id = p.id
  left join stats_90 s on s.product_id = p.id
  left join first_seen fs on fs.product_id = p.id
  where p.status = 'published';
$$;

comment on function public.product_price_stats(text) is
  'Omnibus price statistics per published product for one market (RP-41).';

revoke all on function public.product_price_stats(text) from public;
grant execute on function public.product_price_stats(text) to anon, authenticated, service_role;
