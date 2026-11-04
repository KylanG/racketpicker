-- RP-22: which category × sport combinations have products, for the header menu.
-- Menu items without products are hidden. A view with DISTINCT keeps this to a
-- handful of rows instead of paging through every product.
-- security_invoker: RLS of the caller applies, so anon only sees published products.

create view public.catalog_nav
with (security_invoker = true) as
select distinct p.category_key, p.sport_key, p.is_sample
from public.products p
where p.status = 'published' and p.sport_key is not null;

comment on view public.catalog_nav is
  'Category × sport combinations with published products (header menu, RP-22).';

grant select on public.catalog_nav to anon, authenticated;
