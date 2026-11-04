-- RP-69: starter catalog with 19 real padel rackets (not sample data).
-- Specs: manufacturer data as published on the shops' product pages, checked on 2026-11-04.
-- Prices are not in this migration: they come from src/data/manual-offers.ts (RP-68).
-- Idempotent: safe to run twice.

-- 1. Brands
insert into public.brands (slug, name) values
  ('nox', 'Nox'),
  ('bullpadel', 'Bullpadel'),
  ('babolat', 'Babolat'),
  ('head', 'Head'),
  ('wilson', 'Wilson')
on conflict (slug) do nothing;

-- 2. Shops without an affiliate programme (yet): plain links, prices checked by hand.
insert into public.shops (slug, name, market_code, network, website_url, free_shipping_from, is_active) values
  ('padelshop', 'PadelShop.com', 'nl', 'direct', 'https://padelshop.com', 50, true),
  ('justpadel', 'JustPadel', 'nl', 'direct', 'https://justpadel.com', 50, true),
  ('padelmq', 'PadeLMQ', 'nl', 'direct', 'https://www.padelmq.com', null, true)
on conflict (slug) do nothing;

-- 3. Products, specs and Dutch content
create temporary table starter (
  slug text, brand_slug text, model text, model_year smallint,
  shape public.racket_shape, weight_min smallint, weight_max smallint,
  balance public.racket_balance, balance_mm smallint,
  core text, face text, frame text, texture text, thickness numeric(4, 1),
  levels public.play_level[], style public.play_style,
  intro text, strengths text[], watch_outs text[], ideal_for text
) on commit drop;

insert into starter values
('nox-at10-genius-18k-alum-2026', 'nox', 'AT10 Genius 18K Alum', 2026,
  'teardrop', 360, 375, 'medium', null, 'MLD Black EVA (meerlaags)', 'Carbon 18K Alum', 'Carbon', '3D + zand (Dual Spin)', 38,
  '{advanced,pro}', 'all_round',
  'Het racket van Agustín Tapia voor 2026. Een veelzijdig druppelmodel met 18K aluminium-carbon en een meerlaagse kern, met verwisselbare gewichtjes in de grip om de balans aan te passen.',
  '{"Veelzijdig: zowel verdedigen als afmaken","Balans zelf aan te passen met gewichtjes van 2 en 4 gram","Ruw oppervlak voor veel spin"}',
  '{"Vraagt goede techniek; niet voor beginners","Minder pure smashkracht dan de Attack-versie"}',
  'Gevorderde spelers die een allround racket zoeken met controle én kracht.'),
('nox-at10-genius-attack-18k-alum-2026', 'nox', 'AT10 Genius Attack 18K Alum', 2026,
  'diamond', 360, 375, 'high', null, 'MLD Black EVA (meerlaags)', 'Carbon 18K Alum', 'Carbon', '3D + zand (Dual Spin)', 38,
  '{advanced,pro}', 'power',
  'De aanvallende variant van Tapia''s AT10-lijn: diamantvorm en hoge balans, met dezelfde 18K aluminium-carbon en meerlaagse kern als de Genius.',
  '{"Veel kracht op smash en bandeja","18K carbon voelt comfortabeler dan de 12K-versie","Balans aan te passen met gewichtjes"}',
  '{"Hoge balans belast de arm meer","Kleinere sweet spot dan een rond of druppelmodel"}',
  'Gevorderde aanvallers die punten aan het net willen afmaken.'),
('nox-at10-pro-cup-hard-2026', 'nox', 'AT10 Pro Cup Hard', 2026,
  'teardrop', 360, 375, 'medium', null, 'HR3 Hard EVA', 'Glasvezel (aluminium)', 'Carbon', '3D', 38,
  '{intermediate,advanced}', 'all_round',
  'Een betaalbaarder racket uit de AT10-familie met een harde kern en een glasvezel slagvlak. Druppelvorm met middenbalans.',
  '{"Toegankelijk geprijsd voor een AT10-model","Harde kern geeft directe, snelle bal","Middenbalans: wendbaar"}',
  '{"Harde kern is minder vergevingsgezind bij armklachten","Glasvezel in plaats van carbon slagvlak"}',
  'Spelers op middenniveau die de stap naar een steviger racket willen zetten.'),
('nox-vk10-ventus-control-12k-2026', 'nox', 'VK10 Ventus Control 12K', 2026,
  'round', 360, 375, null, null, 'Black EVA (meerlaags)', 'Carbon 12K', 'Carbon', '3D + zand (Dual Spin)', 38,
  '{advanced,pro}', 'control',
  'Rond controleracket uit de Ventus-lijn van Nox, met een 12K carbon slagvlak en een meerlaagse kern van gemiddelde hardheid.',
  '{"Ronde vorm met grote sweet spot","Veel controle en spin","Stevig 12K carbon slagvlak"}',
  '{"Minder geschikt voor wie vooral kracht zoekt","Gemiddeld-harde kern"}',
  'Gevorderde spelers die het spel van achteruit willen sturen.'),
('adidas-metalbone-pro-edt-2026', 'adidas', 'Metalbone Pro EDT', 2026,
  'diamond', 345, 360, 'high', 285, 'EVA Soft Performance', 'Carbon 16K (aluminium)', 'Carbon', null, 38,
  '{advanced,pro}', 'power',
  'Het signature-racket van Ale Galán: een diamantvormig krachtracket in gelimiteerde oplage, met een verstelbaar gewichtssysteem tot 11,2 gram.',
  '{"Maximale kracht op de smash","Gewicht en balans in te stellen","Relatief zachte kern voor een krachtracket"}',
  '{"Kopzwaar: zwaar voor de arm","Vraagt veel techniek en snelheid"}',
  'Gevorderde tot professionele aanvallers met goede techniek.'),
('adidas-metalbone-ctrl-2026', 'adidas', 'Metalbone CTRL', 2026,
  'round', 345, 360, 'medium', null, 'EVA Soft Performance', 'Carbon 16K (aluminium)', 'Carbon', null, 38,
  '{advanced}', 'control',
  'De controleversie van de Metalbone: ronde vorm en neutrale balans, met hetzelfde verstelbare gewichtssysteem.',
  '{"Ronde vorm en neutrale balans voor controle","Gewicht en balans in te stellen","Zachte kern voor comfort"}',
  '{"Minder smashkracht dan de gewone Metalbone","Prijs ligt hoog voor een controleracket"}',
  'Gevorderde spelers die de Metalbone-kwaliteit willen zonder kopzware balans.'),
('adidas-metalbone-carbon-ctrl-2026', 'adidas', 'Metalbone Carbon CTRL', 2026,
  'round', 360, 375, 'medium', null, 'EVA Soft Performance', 'Carbon 6K', 'Carbon', null, 38,
  '{intermediate,advanced}', 'control',
  'Een toegankelijkere Metalbone met ronde vorm, neutrale balans en een 6K carbon slagvlak.',
  '{"Lagere prijs dan de topmodellen","Ronde vorm, vergevingsgezind","Zachte kern"}',
  '{"6K carbon voelt minder strak dan 16K","Iets zwaarder dan de CTRL"}',
  'Spelers op middenniveau die richting gevorderd groeien en controle zoeken.'),
('adidas-cross-it-light-2026', 'adidas', 'Cross It Light', 2026,
  'round', 345, 360, 'medium', null, 'Soft Energy EVA', 'Carbon 24K (aluminium)', null, '3D', 38,
  '{beginner,intermediate}', 'control',
  'Een licht, rond racket met neutrale balans en een zachte kern. Makkelijk te hanteren en comfortabel voor de arm.',
  '{"Licht en wendbaar","Zachte kern, comfortabel","Ronde vorm met grote sweet spot"}',
  '{"Weinig kracht voor harde aanvallers","Prijs is hoog voor een racket voor beginners"}',
  'Beginners en spelers op middenniveau die comfort en controle willen.'),
('bullpadel-icon-2026', 'bullpadel', 'ICON', 2026,
  'diamond', 370, 375, 'high', 263, 'MultiEVA', 'Xtend Carbon 12K', 'Carbon', '3D', 38,
  '{advanced,pro}', 'power',
  'Een eerbetoon aan Juan Martín Díaz: een diamantvormig aanvalsracket met 12K carbon, een MultiEVA-kern en verstelbaar gewicht.',
  '{"Veel kracht door hoge balans","Ruw oppervlak voor spin","Trillingsdemping in frame en grip"}',
  '{"Zwaar (370–375 g)","Niet geschikt voor beginners"}',
  'Ervaren aanvallers die het initiatief nemen.'),
('bullpadel-hack-04-hybrid-2026', 'bullpadel', 'Hack 04 Hybrid', 2026,
  'hybrid', 365, 375, 'medium', 250, 'MultiEVA', 'Carbon 18K (aluminium)', null, '3D', 38,
  '{advanced}', 'all_round',
  'De hybride versie van de Hack 04: minder kopzwaar dan de gewone Hack, met een aluminium 18K carbon slagvlak en verstelbaar gewicht.',
  '{"Balans tussen kracht en controle","Gewicht tot 12 gram extra in te stellen","Ruw oppervlak voor spin"}',
  '{"Vrij zwaar","Vraagt een gevorderd niveau"}',
  'Gevorderde allround spelers die zowel willen verdedigen als aanvallen.'),
('bullpadel-neuron-02-edge-2026', 'bullpadel', 'Neuron 02 Edge', 2026,
  'hybrid', 365, 375, 'medium', 260, 'MultiEVA', 'Xtend Carbon 3K', null, '3D', 38,
  '{advanced}', 'all_round',
  'Het racket uit de lijn van Fede Chingotto, met een geometrische kop voor een grotere sweet spot en een 3K carbon slagvlak.',
  '{"Grote sweet spot door de geometrische vorm","Stabiel bij harde ballen","Verstelbaar gewicht in de kop"}',
  '{"Zwaar (365–375 g)","Geen racket voor beginners"}',
  'Gevorderde spelers met een controlerend, tactisch spel.'),
('babolat-technical-viper-3-0-2026', 'babolat', 'Technical Viper 3.0', 2026,
  'diamond', 360, 380, 'high', null, 'Hard EVA', 'Carbon 3K', 'Carbon', '3D', null,
  '{advanced,pro}', 'power',
  'Babolat''s krachtracket voor technische aanvallers: diamantvorm, kopzware balans, een harde kern en een extra carbonlaag in de kern.',
  '{"Explosieve kracht","Stabiel bij harde slagen","Trillingsdemping (Vibrabsorb)"}',
  '{"Harde kern: weinig vergevingsgezind","Kopzwaar en vrij zwaar"}',
  'Gevorderde aanvallers die een hard, direct racket zoeken.'),
('babolat-technical-viper-soft-3-0-2026', 'babolat', 'Technical Viper Soft 3.0', 2026,
  'diamond', 355, 375, 'high', null, 'Black EVA (zacht)', 'Soft Carbon', 'Carbon', '3D', null,
  '{advanced}', 'power',
  'De zachtere versie van de Technical Viper: dezelfde aanvallende vorm, maar met een zachtere kern en zachter carbon voor meer comfort.',
  '{"Kracht met meer comfort dan de gewone Viper","Ruw oppervlak voor spin","Trillingsdemping"}',
  '{"Nog steeds kopzwaar","Minder directe bal dan de harde versie"}',
  'Gevorderde aanvallers die kracht willen zonder de hardste kern.'),
('babolat-counter-veron-2-6-2026', 'babolat', 'Counter Veron 2.6', 2026,
  'round', 355, 375, null, null, 'Black EVA', 'CarbonFlex (carbon + glasvezel)', 'Carbon', '3D', null,
  '{advanced}', 'control',
  'Een rond controleracket met CarbonFlex: een mix van carbon en glasvezel die kracht met comfort combineert.',
  '{"Ronde vorm, vergevingsgezind","Comfortabel door de glasvezelmix","Ruw oppervlak voor spin"}',
  '{"Minder kracht dan diamantmodellen"}',
  'Spelers die vanuit de verdediging het spel controleren.'),
('head-radical-motion-2026', 'head', 'Radical Motion', 2026,
  'teardrop', 350, 360, 'medium', null, 'Enhanced Control Foam', null, 'Carbon (dubbele laag)', 'Glad', 38,
  '{intermediate,advanced}', 'all_round',
  'Een licht druppelvormig racket met middenbalans en een glad slagvlak, gericht op controle en wendbaarheid.',
  '{"Licht (350–360 g) en wendbaar","Middenbalans","Goede prijs"}',
  '{"Glad oppervlak geeft minder spin","Minder kracht dan zwaardere modellen"}',
  'Spelers op middenniveau die een licht, veelzijdig racket willen.'),
('head-speed-motion-2025', 'head', 'Speed Motion', 2025,
  'teardrop', null, null, null, null, null, null, 'Graphene 360+', null, null,
  '{intermediate,advanced}', 'all_round',
  'Een licht druppelvormig racket uit de Speed-lijn van 2025, met een vergrote sweet spot.',
  '{"Licht en snel","Vergrote sweet spot","Scherp geprijsd"}',
  '{"Model van 2025"}',
  'Spelers op middenniveau die een snel, allround racket zoeken.'),
('head-extreme-motion-2025', 'head', 'Extreme Motion', 2025,
  'diamond', 360, 360, 'high', 270, 'Power Foam', 'Carbon + glasvezel', null, '3D', 38,
  '{advanced}', 'power',
  'Het aanvalsracket uit de Extreme-lijn van 2025: diamantvorm, hoge balans en een reactieve Power Foam-kern.',
  '{"Veel kracht en spin","Scherpe prijs voor een aanvalsracket"}',
  '{"Hoge balans belast de arm","Model van 2025"}',
  'Gevorderde aanvallers met een beperkt budget.'),
('head-lynx-2025', 'head', 'Lynx', 2025,
  'diamond', null, null, null, null, null, null, null, null, null,
  '{beginner,intermediate}', 'power',
  'Een instapracket van Head met diamantvorm, voor beginners die meer kracht willen.',
  '{"Zeer lage prijs","Echt Head-racket voor beginners"}',
  '{"Diamantvorm is minder vergevingsgezind dan rond","Weinig technische specificaties bekend"}',
  'Beginners met een klein budget.'),
('wilson-endure-pro-v1-2026', 'wilson', 'Endure Pro V1', 2026,
  'round', 355, 370, 'low', null, 'EVA', null, null, 'Zand', null,
  '{advanced}', 'control',
  'Het topmodel van Wilsons nieuwe Endure-lijn: rond, lage balans en een kern van gemiddelde hardheid.',
  '{"Zeer wendbaar door lage balans","Controle en precisie","Comfortabel bij lange sessies"}',
  '{"Weinig smashkracht"}',
  'Gevorderde spelers die controle en wendbaarheid voorop zetten.');

insert into public.products (brand_id, sport_key, category_key, model, model_year, tier, status, is_sample)
select b.id, 'padel', 'rackets', s.model, s.model_year, 'B', 'published', false
from starter s join public.brands b on b.slug = s.brand_slug
on conflict (brand_id, model, model_year) do nothing;

insert into public.racket_specs (product_id, shape, weight_min_g, weight_max_g, balance, balance_mm,
  core_material, face_material, frame_material, surface_texture, thickness_mm, levels, play_style)
select p.id, s.shape, s.weight_min, s.weight_max, s.balance, s.balance_mm,
  s.core, s.face, s.frame, s.texture, s.thickness, s.levels, s.style
from starter s
join public.brands b on b.slug = s.brand_slug
join public.products p on p.brand_id = b.id and p.model = s.model and p.model_year = s.model_year
on conflict (product_id) do update set
  shape = excluded.shape, weight_min_g = excluded.weight_min_g, weight_max_g = excluded.weight_max_g,
  balance = excluded.balance, balance_mm = excluded.balance_mm, core_material = excluded.core_material,
  face_material = excluded.face_material, frame_material = excluded.frame_material,
  surface_texture = excluded.surface_texture, thickness_mm = excluded.thickness_mm,
  levels = excluded.levels, play_style = excluded.play_style;

insert into public.product_content (product_id, market_code, slug, title, seo_title, seo_description,
  intro, strengths, watch_outs, ideal_for, is_published)
select p.id, 'nl', s.slug,
  b.name || ' ' || s.model || ' ' || s.model_year,
  b.name || ' ' || s.model || ' ' || s.model_year || ' prijzen vergelijken | Racketpicker',
  'Vergelijk de prijs van de ' || b.name || ' ' || s.model || ' ' || s.model_year || ' bij Nederlandse padelwinkels. Specificaties, niveau en speelstijl op een rij.',
  s.intro, s.strengths, s.watch_outs, s.ideal_for, true
from starter s
join public.brands b on b.slug = s.brand_slug
join public.products p on p.brand_id = b.id and p.model = s.model and p.model_year = s.model_year
on conflict (product_id, market_code) do update set
  slug = excluded.slug, title = excluded.title, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, intro = excluded.intro, strengths = excluded.strengths,
  watch_outs = excluded.watch_outs, ideal_for = excluded.ideal_for, is_published = true;
