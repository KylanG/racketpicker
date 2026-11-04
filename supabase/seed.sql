-- RP-15: sample catalog data for development and previews.
--
-- * Re-runnable: removes all is_sample products first (cascades to specs, scores,
--   content, images, offers and price history), then inserts fresh data.
-- * Every product has is_sample = true. The app hides samples unless
--   NEXT_PUBLIC_SHOW_SAMPLE_DATA=true (Preview/Development only, never Production).
-- * Product names follow the real Adidas 2026 and Kuikma Carbon lines, but specs, scores,
--   prices and texts are EXAMPLES. Real data comes from the feeds (RP-16/17) and editorial work.
--
-- Run: npm run db:seed (needs SUPABASE_DB_URL), or paste into the Supabase SQL editor.

begin;

delete from public.products where is_sample;

-- Brands -------------------------------------------------------------------
insert into public.brands (slug, name) values
  ('adidas', 'Adidas'),
  ('kuikma', 'Kuikma')
on conflict (slug) do update set name = excluded.name;

-- Shops (real NL affiliate shops; network ids are filled in by RP-16/17) -----
insert into public.shops (slug, name, market_code, network, website_url, shipping_info, free_shipping_from, is_active) values
  ('padelparade', 'Padelparade', 'nl', 'daisycon', 'https://www.padelparade.nl', 'Gratis verzending vanaf € 50', 50, true),
  ('padeldiscount', 'Padeldiscount', 'nl', 'daisycon', 'https://www.padeldiscount.nl', 'Gratis verzending vanaf € 75', 75, true),
  ('padel-point', 'Padel-Point', 'nl', 'awin', 'https://www.padel-point.nl', 'Gratis verzending vanaf € 59', 59, true),
  ('smash-expert', 'Smash-Expert', 'nl', 'awin', 'https://www.smash-expert.nl', 'Gratis verzending vanaf € 100', 100, true)
on conflict (slug) do update set
  name = excluded.name, network = excluded.network, website_url = excluded.website_url,
  shipping_info = excluded.shipping_info, free_shipping_from = excluded.free_shipping_from;

-- Products -----------------------------------------------------------------
create temporary table seed_products (
  brand_slug text, model text, model_year smallint, tier public.content_tier,
  shape public.racket_shape, weight_min smallint, weight_max smallint,
  balance public.racket_balance, core text, face text, texture text, thickness numeric,
  levels public.play_level[], style public.play_style,
  power smallint, control smallint, sweet_spot smallint, maneuverability smallint, comfort smallint,
  base_price numeric, slug text, intro text, strengths text[], watch_outs text[], ideal_for text
) on commit drop;

insert into seed_products values
  ('adidas', 'Neuvortx Lime', 2026, 'A', 'teardrop', 355, 370, 'medium', 'EVA Soft', 'Carbon 3K', '3D', 38,
    '{intermediate,advanced}', 'all_round', 78, 82, 80, 76, 84, 96.74, 'adidas-neuvortx-lime-2026',
    'Allround-racket met een zachte kern en een grote sweetspot.',
    '{"Veel comfort bij lange rally''s","Vergevingsgezind buiten het midden"}', '{"Minder explosief bij smashes"}',
    'Gevorderde spelers die controle en comfort zoeken.'),
  ('adidas', 'Match Black Lime', 2026, 'B', 'round', 345, 360, 'low', 'EVA Soft', 'Fiberglass', 'smooth', 38,
    '{beginner}', 'control', 60, 82, 85, 84, 86, 69.95, 'adidas-match-black-lime-2026',
    'Licht en vergevingsgezind instapmodel.', '{"Makkelijk te hanteren","Grote sweetspot"}', '{"Weinig power"}',
    'Beginners die de slagen onder de knie willen krijgen.'),
  ('adidas', 'Drive', 2026, 'B', 'round', 350, 365, 'low', 'EVA Soft', 'Fiberglass', 'sand', 38,
    '{beginner,intermediate}', 'control', 64, 80, 84, 82, 85, 79.95, 'adidas-drive-2026',
    'Toegankelijk racket met veel controle.', '{"Prettig voor beginners","Voelt licht aan"}', '{"Minder geschikt voor harde smashes"}',
    'Recreatieve spelers die stabiel willen spelen.'),
  ('adidas', 'Metalbone', 2026, 'A', 'diamond', 360, 375, 'high', 'EVA Hard', 'Carbon 18K', '3D', 38,
    '{advanced,pro}', 'power', 92, 70, 66, 68, 64, 289.95, 'adidas-metalbone-2026',
    'Aanvallend topmodel voor maximale power.', '{"Veel power bij smashes","Strak gevoel"}', '{"Kleine sweetspot","Veeleisend voor de arm"}',
    'Ervaren aanvallende spelers.'),
  ('adidas', 'Cross It Carbon', 2026, 'B', 'teardrop', 355, 370, 'medium', 'EVA Medium', 'Carbon 12K', 'sand', 38,
    '{intermediate,advanced}', 'all_round', 80, 78, 76, 76, 74, 169.95, 'adidas-cross-it-carbon-2026',
    'Veelzijdig racket tussen controle en power in.', '{"Goede balans","Stevig slagvlak"}', '{"Iets harder dan een softe kern"}',
    'Spelers die van verdedigen naar aanvallen schakelen.'),
  ('adidas', 'RX Series', 2026, 'C', 'round', 345, 360, 'low', 'EVA Soft', 'Fiberglass', 'smooth', 38,
    '{beginner}', 'control', 58, 78, 82, 84, 86, 49.95, 'adidas-rx-series-2026',
    null, '{}', '{}', null),
  ('kuikma', 'Carbon 26 Control', 2026, 'B', 'round', 355, 365, 'low', 'EVA Soft', 'Carbon 3K', 'sand', 38,
    '{intermediate}', 'control', 66, 84, 82, 80, 82, 89.99, 'kuikma-carbon-26-control',
    'Betaalbaar carbon-racket met de focus op controle.', '{"Veel controle voor de prijs"}', '{"Beperkte power"}',
    'Gevorderde spelers met een tactische speelstijl.'),
  ('kuikma', 'Carbon 26 Hybrid', 2026, 'B', 'teardrop', 360, 370, 'medium', 'EVA Medium', 'Carbon 3K', 'sand', 38,
    '{intermediate,advanced}', 'all_round', 76, 78, 76, 76, 76, 99.99, 'kuikma-carbon-26-hybrid',
    'Allrounder met een gemiddelde balans.', '{"Goede prijs-kwaliteit"}', '{"Minder comfort dan een softe kern"}',
    'Spelers die alles willen kunnen.'),
  ('kuikma', 'Carbon 26 Power', 2026, 'B', 'diamond', 365, 375, 'high', 'EVA Hard', 'Carbon 12K', '3D', 38,
    '{advanced}', 'power', 86, 70, 68, 70, 66, 119.99, 'kuikma-carbon-26-power',
    'Aanvallend racket met een kopzware balans.', '{"Veel power voor de prijs"}', '{"Kleine sweetspot"}',
    'Aanvallende spelers met een budget.'),
  ('kuikma', 'Carbon 26 Comfort', 2026, 'C', 'round', 350, 360, 'low', 'Foam', 'Carbon 3K', 'smooth', 38,
    '{beginner,intermediate}', 'control', 62, 80, 84, 82, 88, 79.99, 'kuikma-carbon-26-comfort',
    null, '{}', '{}', null);

insert into public.products (brand_id, sport_key, category_key, model, model_year, tier, status, is_sample)
select b.id, 'padel', 'rackets', s.model, s.model_year, s.tier, 'published', true
from seed_products s join public.brands b on b.slug = s.brand_slug;

insert into public.racket_specs (product_id, shape, weight_min_g, weight_max_g, balance, core_material,
  face_material, surface_texture, thickness_mm, levels, play_style)
select p.id, s.shape, s.weight_min, s.weight_max, s.balance, s.core, s.face, s.texture, s.thickness, s.levels, s.style
from seed_products s
join public.brands b on b.slug = s.brand_slug
join public.products p on p.brand_id = b.id and p.model = s.model and p.model_year = s.model_year;

insert into public.product_scores (product_id, power, control, sweet_spot, maneuverability, comfort, source, method_note)
select p.id, s.power, s.control, s.sweet_spot, s.maneuverability, s.comfort, 'specs',
  'Voorbeeldwaarden voor ontwikkeling, niet gemeten.'
from seed_products s
join public.brands b on b.slug = s.brand_slug
join public.products p on p.brand_id = b.id and p.model = s.model and p.model_year = s.model_year;

insert into public.product_content (product_id, market_code, slug, title, seo_title, seo_description,
  intro, strengths, watch_outs, ideal_for, faq, is_published)
select p.id, 'nl', s.slug,
  b.name || ' ' || s.model || ' ' || s.model_year,
  b.name || ' ' || s.model || ' ' || s.model_year || ' vergelijken | Racketpicker',
  'Vergelijk prijzen van de ' || b.name || ' ' || s.model || ' ' || s.model_year || ' bij Nederlandse padelwinkels.',
  s.intro, s.strengths, s.watch_outs, s.ideal_for,
  case when s.tier = 'A' then jsonb_build_array(
    jsonb_build_object('question', 'Voor welk niveau is dit racket geschikt?',
      'answer', 'Voorbeeldantwoord: vooral voor gevorderde spelers.'),
    jsonb_build_object('question', 'Is dit racket geschikt bij armklachten?',
      'answer', 'Voorbeeldantwoord: kies bij armklachten liever een racket met een zachte kern.'))
  else '[]'::jsonb end,
  true
from seed_products s
join public.brands b on b.slug = s.brand_slug
join public.products p on p.brand_id = b.id and p.model = s.model and p.model_year = s.model_year;

-- Offers: 2 to 4 shops per product, prices spread around the base price -------
insert into public.offers (product_id, shop_id, market_code, external_id, feed_title, price, shipping_cost,
  stock_status, delivery_days_min, delivery_days_max, affiliate_url, product_url)
select
  p.id, sh.id, 'nl',
  'sample-' || s.slug,
  b.name || ' ' || s.model || ' ' || s.model_year,
  round(s.base_price * (array[1.00, 1.04, 0.97, 1.08])[sh.n], 2) - 0.01 * ((sh.n + 1) % 2),
  case when s.base_price * (array[1.00, 1.04, 0.97, 1.08])[sh.n] >= sh.free_shipping_from then 0 else 4.95 end,
  (array['in_stock', 'in_stock', 'low_stock', 'out_of_stock']::public.stock_status[])[1 + (abs(hashtext(s.slug || sh.slug)) % 4)],
  1, 3,
  sh.website_url || '/?sample=' || s.slug,
  sh.website_url
from seed_products s
join public.brands b on b.slug = s.brand_slug
join public.products p on p.brand_id = b.id and p.model = s.model and p.model_year = s.model_year
join (
  select id, slug, website_url, free_shipping_from, row_number() over (order by slug)::int as n
  from public.shops where slug in ('padelparade', 'padeldiscount', 'padel-point', 'smash-expert')
) sh on sh.n <= 2 + (abs(hashtext(s.slug)) % 3);

-- Price history: 90 days per offer, one scenario per product (RP-41) -------------
-- Exercises the Omnibus rules: a discount counts only against the lowest price of the
-- 30 days before the reduction, and only when the history covers those 30 days.
--   deal    reduced 3 days ago from 12–20% higher: shows "-X%"
--   stable  hovers just above today's price: no discount
--   raised  was lower 11–28 days ago, then raised, now back: no discount (looks like one vs. last week)
--   new     only 20 days of history: no discount, however large the drop
insert into public.price_history (offer_id, recorded_on, price, shipping_cost, stock_status)
select
  o.id,
  current_date - d,
  round(o.price * (case sc.scenario
    when 'deal' then case when d <= 3 then 1 else 1.12 + 0.04 * (sc.n % 3) + 0.02 * abs(sin(d / 5.0)) end
    when 'stable' then case when d = 0 then 1 else 1 + 0.02 * abs(sin(d / 6.0 + sc.n)) end
    when 'raised' then case when d = 0 then 1 when d <= 10 then 1.30 when d <= 28 then 0.95 else 1.05 end
    else case when d <= 2 then 1 else 1.20 end
  end)::numeric, 2),
  o.shipping_cost,
  o.stock_status
from public.offers o
join (
  select id, n, (array['deal', 'stable', 'deal', 'raised', 'new'])[1 + (n - 1) % 5] as scenario
  from (select id, row_number() over (order by model)::int as n from public.products where is_sample) ranked
) sc on sc.id = o.product_id
cross join generate_series(0, 89) as d
where sc.scenario <> 'new' or d < 20;

commit;
