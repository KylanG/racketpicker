-- RP-83 step 2: remember which racket_specs values came from a source, so an improved
-- mapping may correct them while hand-entered values stay untouched.
alter table public.product_source_specs
  add column applied jsonb not null default '{}' check (jsonb_typeof(applied) = 'object');

comment on column public.product_source_specs.applied is
  'racket_specs columns last written from this source; a column whose value still matches may be rewritten.';

-- Products created by the bol discovery (tier C) only have specs from bol so far.
update public.product_source_specs s
set applied = jsonb_strip_nulls(jsonb_build_object(
  'shape', r.shape,
  'weight_min_g', r.weight_min_g,
  'weight_max_g', r.weight_max_g,
  'balance', r.balance,
  'balance_mm', r.balance_mm,
  'core_material', r.core_material,
  'face_material', r.face_material,
  'thickness_mm', r.thickness_mm,
  'levels', case when cardinality(r.levels) > 0 then to_jsonb(r.levels) end,
  'play_style', r.play_style
))
from public.racket_specs r, public.products p
where r.product_id = s.product_id and p.id = s.product_id and p.tier = 'C' and s.source = 'bol';
