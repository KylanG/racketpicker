-- RP-77: type within a category, for accessories imported from bol (padelballen, grips,
-- tassen). Rackets keep null. The accessories pages (follow-up ticket) filter on it.
alter table public.products
  add column if not exists product_type text
    check (product_type is null or product_type in ('balls', 'grips', 'bags'));

comment on column public.products.product_type is
  'Type within the category (accessories: balls, grips, bags); null for rackets.';
