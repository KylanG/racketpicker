-- RP-33: price and stock alerts per product, with double opt-in. Server only: RLS on,
-- no grants to anon/authenticated (like subscribers, RP-32).
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  market_code text not null default 'nl',
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('price', 'stock')),
  target_price numeric(10, 2) check (target_price is null or target_price > 0),
  -- pending → active (confirmed) → triggered (one mail, then it rests) | unsubscribed
  status text not null default 'pending'
    check (status in ('pending', 'active', 'triggered', 'unsubscribed')),
  confirm_token_hash text,
  unsubscribe_token_hash text not null,
  confirm_sent_at timestamptz,
  confirmed_at timestamptz,
  notified_at timestamptz,
  notified_price numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alerts_price_has_target check (kind = 'stock' or target_price is not null),
  constraint alerts_email_product_kind_key unique (email, market_code, product_id, kind)
);

create index if not exists alerts_active_idx on public.alerts (status, product_id);
create index if not exists alerts_confirm_token_idx on public.alerts (confirm_token_hash);
create index if not exists alerts_unsubscribe_token_idx on public.alerts (unsubscribe_token_hash);

alter table public.alerts enable row level security;
revoke all on public.alerts from anon, authenticated;

comment on table public.alerts is
  'Price/stock alerts (RP-33). Checked after the daily import; one mail per alert, then status triggered.';
