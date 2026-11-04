-- RP-16/17: shops and feed sources for the first NL affiliates.
-- Everything starts inactive; switch on per shop once the programme is approved and the
-- feed URL is in DAISYCON_FEED_URLS / AWIN_FEED_URLS.
-- First version imports padel rackets only, also for padel-only shops.

insert into public.shops (slug, name, market_code, network, website_url, is_active) values
  ('daka', 'Daka', 'nl', 'daisycon', 'https://www.daka.nl', false)
on conflict (slug) do nothing;

insert into public.feed_sources (shop_id, network, feed_key, format, filter, is_active)
select s.id, s.network, s.slug, 'csv', 'padel_rackets', false
from public.shops s
where s.slug in ('padeldiscount', 'daka', 'padel-point', 'smash-expert')
on conflict (shop_id) do nothing;
