-- RP-93: PadelXpert (padelxpert.nl) via Adtraction. The program id (1884003964) comes from
-- the tracking link on.padelxpert.nl/t/t?a=1884003964&as=2127163100 (as = our channel).
-- The feed URL holds our credentials, so it lives in ADTRACTION_FEED_URLS under
-- "padelxpert", not here.
-- Shipping terms are not filled in yet: take them from the feed or the shop before launch.
-- Starts inactive; switched on after the merge, once the first real feed has been checked.
insert into public.shops (
  slug, name, market_code, network, network_advertiser_id, website_url, is_active
) values (
  'padelxpert', 'PadelXpert', 'nl', 'adtraction', '1884003964', 'https://www.padelxpert.nl', false
)
on conflict (slug) do nothing;

insert into public.feed_sources (shop_id, network, feed_key, format, filter, is_active)
select s.id, 'adtraction', 'padelxpert', 'csv', 'padel_rackets_bags', false
from public.shops s
where s.slug = 'padelxpert'
on conflict (shop_id) do nothing;
