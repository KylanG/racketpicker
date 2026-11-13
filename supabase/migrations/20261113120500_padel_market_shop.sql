-- RP-91: Padel Market (Spain, ships to NL) via Awin, advertiser 24562, English Feed EUR
-- (datafeed 98176). The feed URL holds the API key, so it lives in AWIN_FEED_URLS under
-- "padel-market", not here.
-- Shipping to NL per product in the feed: € 19,95 under € 50, then € 12,95 / € 7,95 /
-- € 4,95, free from about € 200. Delivery 3–7 working days.
-- Starts inactive; switched on after the merge, with the first import.
insert into public.shops (
  slug, name, market_code, network, network_advertiser_id, website_url,
  free_shipping_from, shipping_info, is_active
) values (
  'padel-market', 'Padel Market', 'nl', 'awin', '24562', 'https://padelmarket.com',
  200.00, 'Gratis verzending vanaf € 200', false
)
on conflict (slug) do nothing;

insert into public.feed_sources (shop_id, network, feed_key, format, filter, is_active)
select s.id, 'awin', 'padel-market', 'csv_gz', 'padel_rackets_bags', false
from public.shops s
where s.slug = 'padel-market'
on conflict (shop_id) do nothing;
