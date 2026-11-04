-- RP-68: manual offers. Until the affiliate feeds run, prices are checked by hand and
-- kept in the repo (src/data/manual-offers.ts). The daily cron sends them here.
--
-- * offers.source = 'manual', offers.checked_at = when the price was checked.
-- * A manual offer is only active for 7 days after its check, then hidden.
-- * A feed offer of the same shop and product always wins: the manual one is turned off.
-- * Price history gets one row per check (the day it was checked), never filled in.

alter table public.offers
  add column source text not null default 'feed' check (source in ('feed', 'manual')),
  add column checked_at timestamptz;

comment on column public.offers.source is 'feed = affiliate feed, manual = checked by hand (RP-68).';
comment on column public.offers.checked_at is 'When a manual price was last checked; manual offers expire 7 days later.';

create index offers_manual_idx on public.offers (market_code, checked_at) where source = 'manual';

create or replace function public.upsert_manual_offers(p_market_code text, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  v_shop_id uuid;
  v_product_id uuid;
  v_title text;
  v_offer_id uuid;
  v_checked date;
  v_external text;
  v_seen text[] := '{}';
  stats jsonb := jsonb_build_object('upserted', 0, 'feed_wins', 0, 'unknown_shop', 0, 'unknown_product', 0, 'expired', 0, 'removed', 0);
begin
  for item in select * from jsonb_array_elements(p_items) loop
    select id into v_shop_id from public.shops where slug = item->>'shop' and market_code = p_market_code;
    if v_shop_id is null then
      stats := jsonb_set(stats, '{unknown_shop}', to_jsonb((stats->>'unknown_shop')::int + 1));
      continue;
    end if;

    select c.product_id, c.title into v_product_id, v_title
    from public.product_content c
    where c.slug = item->>'product' and c.market_code = p_market_code;
    if v_product_id is null then
      stats := jsonb_set(stats, '{unknown_product}', to_jsonb((stats->>'unknown_product')::int + 1));
      continue;
    end if;

    v_external := 'manual:' || (item->>'product');
    v_checked := (item->>'checked_on')::date;
    v_seen := v_seen || (v_shop_id::text || '|' || v_external);

    -- A live feed offer of this shop for this product wins.
    if exists (
      select 1 from public.offers o
      where o.shop_id = v_shop_id and o.product_id = v_product_id
        and o.source = 'feed' and o.is_active
    ) then
      update public.offers set is_active = false, updated_at = now()
      where shop_id = v_shop_id and external_id = v_external;
      stats := jsonb_set(stats, '{feed_wins}', to_jsonb((stats->>'feed_wins')::int + 1));
      continue;
    end if;

    insert into public.offers (
      product_id, shop_id, market_code, external_id, feed_title, price, currency, shipping_cost,
      stock_status, affiliate_url, product_url, is_active, last_seen_at, source, checked_at
    ) values (
      v_product_id, v_shop_id, p_market_code, v_external, v_title,
      (item->>'price')::numeric, 'EUR', nullif(item->>'shipping', '')::numeric,
      coalesce(nullif(item->>'stock', ''), 'unknown')::public.stock_status,
      item->>'url', item->>'url',
      v_checked > current_date - 7, v_checked::timestamptz, 'manual', v_checked::timestamptz
    )
    on conflict (shop_id, external_id) do update set
      product_id = excluded.product_id,
      feed_title = excluded.feed_title,
      price = excluded.price,
      shipping_cost = excluded.shipping_cost,
      stock_status = excluded.stock_status,
      affiliate_url = excluded.affiliate_url,
      product_url = excluded.product_url,
      is_active = excluded.is_active,
      last_seen_at = excluded.last_seen_at,
      checked_at = excluded.checked_at,
      source = 'manual',
      updated_at = now()
    returning id into v_offer_id;

    insert into public.price_history (offer_id, recorded_on, price, shipping_cost, stock_status)
    values (
      v_offer_id, v_checked, (item->>'price')::numeric, nullif(item->>'shipping', '')::numeric,
      coalesce(nullif(item->>'stock', ''), 'unknown')::public.stock_status
    )
    on conflict (offer_id, recorded_on) do update set
      price = excluded.price, shipping_cost = excluded.shipping_cost, stock_status = excluded.stock_status;

    stats := jsonb_set(stats, '{upserted}', to_jsonb((stats->>'upserted')::int + 1));
  end loop;

  -- Manual offers that were removed from the list are turned off.
  with removed as (
    update public.offers set is_active = false, updated_at = now()
    where source = 'manual' and market_code = p_market_code and is_active
      and not ((shop_id::text || '|' || external_id) = any (v_seen))
    returning 1
  )
  select jsonb_set(stats, '{removed}', to_jsonb(count(*)::int)) into stats from removed;

  -- Older than 7 days: hidden until checked again.
  with expired as (
    update public.offers set is_active = false, updated_at = now()
    where source = 'manual' and market_code = p_market_code and is_active
      and checked_at <= current_date - 7
    returning 1
  )
  select jsonb_set(stats, '{expired}', to_jsonb(count(*)::int)) into stats from expired;

  return stats;
end;
$$;

comment on function public.upsert_manual_offers(text, jsonb) is
  'Imports hand-checked offers (RP-68); manual offers expire 7 days after their check.';

revoke all on function public.upsert_manual_offers(text, jsonb) from public, anon, authenticated;
grant execute on function public.upsert_manual_offers(text, jsonb) to service_role;
