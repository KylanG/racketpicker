-- RP-92: a product is unique per brand, category, type, model and year, and only among
-- real products. Before, (brand_id, model, model_year) blocked
--   - a racket bag with the name of its racket series (Bullpadel Pearl 2027 bag vs racket)
--   - a real product with the name of a sample (Adidas Metalbone 2026, preview only).
-- Model year null stays "distinct", as before.
alter table public.products drop constraint if exists products_brand_id_model_model_year_key;

create unique index if not exists products_identity_key
  on public.products (brand_id, category_key, coalesce(product_type, ''), model, model_year)
  where not is_sample;
