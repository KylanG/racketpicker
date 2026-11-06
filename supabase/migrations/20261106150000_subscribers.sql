-- RP-32: newsletter subscribers with double opt-in. Only the server (service role)
-- reads and writes this table: no grants to anon/authenticated, RLS on without policies.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  market_code text not null default 'nl',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  -- SHA-256 of the tokens in the mails; the tokens themselves are never stored.
  confirm_token_hash text,
  unsubscribe_token_hash text not null,
  confirm_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscribers_email_market_key unique (email, market_code),
  constraint subscribers_email_lower check (email = lower(email))
);

create index if not exists subscribers_confirm_token_idx on public.subscribers (confirm_token_hash);
create index if not exists subscribers_unsubscribe_token_idx on public.subscribers (unsubscribe_token_hash);

alter table public.subscribers enable row level security;
revoke all on public.subscribers from anon, authenticated;

comment on table public.subscribers is
  'Newsletter sign-ups (RP-32). Double opt-in: status pending until the link in the mail is clicked.';
