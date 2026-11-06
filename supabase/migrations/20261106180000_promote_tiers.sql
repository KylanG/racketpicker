-- RP-82: products move from tier C (noindex) to B (indexable) by themselves once they
-- have something to compare: published, real (not sample data), with a photo, and active
-- offers from at least two active shops in one market. Never downgrades, never touches A.
create or replace function public.promote_tiers()
returns integer
language sql
set search_path = public
as $$
  with promoted as (
    update public.products p
    set tier = 'B'
    where p.tier = 'C'
      and p.status = 'published'
      and not p.is_sample
      and exists (select 1 from public.product_images i where i.product_id = p.id)
      and exists (
        select 1
        from public.offers o
        join public.shops s on s.id = o.shop_id and s.is_active
        where o.product_id = p.id and o.is_active
        group by o.market_code
        having count(distinct o.shop_id) >= 2
      )
    returning p.id
  )
  select count(*)::integer from promoted;
$$;

comment on function public.promote_tiers() is
  'RP-82: tier C -> B for real, published products with a photo and >= 2 active shops in one market.';

revoke all on function public.promote_tiers() from public, anon, authenticated;
grant execute on function public.promote_tiers() to service_role;
