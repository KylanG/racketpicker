-- RP-93: PadelXpert (padelxpert.nl) via Adtraction, program 1884003961 (apid in the feed URL;
-- the tracking link's a=1884003964 is the ad, not the program). Our channel is 2127163100.
-- The feed URL holds our credentials, so it lives in ADTRACTION_FEED_URLS under
-- "padelxpert", not here.
-- Shipping (from the shop, 21 nov): free from € 79, otherwise € 3,94; delivery 2–3 working days.
-- Starts inactive; switched on after the merge, once the first real feed has been checked.
insert into public.shops (
  slug, name, market_code, network, network_advertiser_id, website_url,
  free_shipping_from, shipping_info, is_active
) values (
  'padelxpert', 'PadelXpert', 'nl', 'adtraction', '1884003961', 'https://www.padelxpert.nl',
  79.00, 'Gratis verzending vanaf € 79, anders € 3,94. Levertijd 2–3 werkdagen.', false
)
on conflict (slug) do nothing;

insert into public.feed_sources (shop_id, network, feed_key, format, filter, is_active)
select s.id, 'adtraction', 'padelxpert', 'csv', 'padel_rackets_bags', false
from public.shops s
where s.slug = 'padelxpert'
on conflict (shop_id) do nothing;
