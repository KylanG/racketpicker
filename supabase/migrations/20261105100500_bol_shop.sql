-- RP-72: bol.com shop + source, and the EANs of the starter catalog (RP-69).
-- Prices come from the Marketing Catalog API per EAN in the daily cron (src/lib/feeds/bol.ts).

insert into public.shops (slug, name, market_code, network, website_url, is_active) values
  ('bol', 'bol', 'nl', 'bol', 'https://www.bol.com', true)
on conflict (slug) do nothing;

-- feed_key and format are unused for the API; filter 'all' because we only ask for our own EANs.
insert into public.feed_sources (shop_id, network, feed_key, format, filter, is_active)
select s.id, 'bol', 'bol-api', 'csv', 'all', true
from public.shops s where s.slug = 'bol'
on conflict (shop_id) do nothing;

-- EANs from the shops' own product data (barcode), checked on 2026-11-05.
-- Where a second shop sells the racket (PadeLMQ, JustPadel), its barcode matched.
-- UPC-12 codes are stored as EAN-13 with a leading zero (normalizeGtin).
update public.products p set gtins = e.gtins
from (values
  ('nox-at10-genius-18k-alum-2026', '{8435778902621}'::text[]),
  ('nox-at10-genius-attack-18k-alum-2026', '{8435778902638}'),
  ('nox-at10-pro-cup-hard-2026', '{8435778902720}'),
  ('nox-vk10-ventus-control-12k-2026', '{8435778902706}'),
  ('adidas-metalbone-pro-edt-2026', '{8435739409497}'),
  ('adidas-metalbone-ctrl-2026', '{8435739405819}'),
  ('adidas-metalbone-carbon-ctrl-2026', '{8435739405840}'),
  ('adidas-cross-it-light-2026', '{8435739405956}'),
  ('bullpadel-icon-2026', '{8445402974115}'),
  ('bullpadel-hack-04-hybrid-2026', '{8445402973958}'),
  ('bullpadel-neuron-02-edge-2026', '{8445402974108}'),
  ('babolat-technical-viper-3-0-2026', '{3324922283110}'),
  ('babolat-technical-viper-soft-3-0-2026', '{3324922283226}'),
  ('babolat-counter-veron-2-6-2026', '{3324922283172}'),
  ('head-radical-motion-2026', '{0198772134440}'),
  ('head-speed-motion-2025', '{0726423385998}'),
  ('head-extreme-motion-2025', '{0198772101275}'),
  ('head-lynx-2025', '{0198772074463}'),
  ('wilson-endure-pro-v1-2026', '{0097512976282}')
) as e(slug, gtins)
join public.product_content c on c.slug = e.slug and c.market_code = 'nl'
where p.id = c.product_id;
