-- RP-40: taxonomy as in the design handover: category × sport
-- (/nl/rackets/padel, /nl/schoenen/tennis …).
-- Before: categories were sport-specific ('padel-rackets'). After: four generic categories
-- (rackets, shoes, clothing, accessories) and the sport on the product itself.

-- 1. All six sports from the handover (keys in English; public slugs live in the app).
insert into public.sports (key, sort_order) values
  ('padel', 1), ('tennis', 2), ('badminton', 3), ('squash', 4), ('pickleball', 5), ('table-tennis', 6)
on conflict (key) do update set sort_order = excluded.sort_order;

-- 2. Generic categories.
alter table public.categories alter column sport_key drop not null;
insert into public.categories (key, sport_key, sort_order) values
  ('rackets', null, 1), ('shoes', null, 2), ('clothing', null, 3), ('accessories', null, 4)
on conflict (key) do nothing;

-- 3. Sport on the product, backfilled from the old sport-specific category.
alter table public.products add column sport_key text references public.sports (key);
update public.products p set sport_key = c.sport_key
from public.categories c
where c.key = p.category_key and c.sport_key is not null;
update public.products set sport_key = 'padel' where sport_key is null;
alter table public.products alter column sport_key set not null;

-- 4. Move products to the generic categories and drop the old ones.
update public.products set category_key = case category_key
  when 'padel-rackets' then 'rackets'
  when 'padel-shoes' then 'shoes'
  when 'padel-bags' then 'accessories'
  when 'padel-balls' then 'accessories'
  else category_key end;
delete from public.categories where key in ('padel-rackets', 'padel-shoes', 'padel-bags', 'padel-balls');
alter table public.categories drop column sport_key;

-- 5. Overview pages query by sport + category + status.
drop index if exists public.products_category_status_idx;
create index products_sport_category_status_idx on public.products (sport_key, category_key, status);
