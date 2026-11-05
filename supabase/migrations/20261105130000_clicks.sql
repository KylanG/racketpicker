-- RP-52: outbound clicks via /go/[shop]/[offer]. No personal data: no IP, no user agent,
-- no cookies; only which offer was clicked, from which page and when.

create table public.clicks (
  id bigint generated always as identity primary key,
  offer_id uuid not null references public.offers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  market_code text not null references public.markets (code),
  -- Path of our page the click came from, e.g. /nl/rackets/padel/... (no query string).
  source_path text check (source_path is null or char_length(source_path) <= 300),
  clicked_at timestamptz not null default now()
);
create index clicks_product_idx on public.clicks (product_id, clicked_at desc);
create index clicks_shop_idx on public.clicks (shop_id, clicked_at desc);

-- Nobody reads or writes the table directly; service_role keeps access via default privileges.
alter table public.clicks enable row level security;
revoke all on public.clicks from anon, authenticated;

-- The redirect route logs a click through this function, so it also works without the
-- secret key (Preview). Product, shop and market come from the offer itself.
create or replace function public.record_click(p_offer_id uuid, p_source_path text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.clicks (offer_id, product_id, shop_id, market_code, source_path)
  select o.id, o.product_id, o.shop_id, o.market_code,
         nullif(left(p_source_path, 300), '')
  from public.offers o
  where o.id = p_offer_id and o.product_id is not null;
$$;
revoke all on function public.record_click(uuid, text) from public;
grant execute on function public.record_click(uuid, text) to anon, authenticated;

-- Example: clicks per product and shop over the last 30 days
--   select p.model, s.slug, count(*) from public.clicks c
--   join public.products p on p.id = c.product_id join public.shops s on s.id = c.shop_id
--   where c.clicked_at > now() - interval '30 days' group by 1, 2 order by 3 desc;
