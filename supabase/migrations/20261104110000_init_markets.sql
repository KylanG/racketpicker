-- Markets (countries/languages) the site serves. Offers and content reference these later.
create table public.markets (
  code text primary key check (code ~ '^[a-z]{2}$'),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  intl_locale text not null,
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.markets is 'Site markets (nl, es). is_active mirrors NEXT_PUBLIC_ACTIVE_LOCALES.';

alter table public.markets enable row level security;

-- New tables are not exposed automatically: grant read explicitly.
grant select on public.markets to anon, authenticated;

create policy "Markets are publicly readable"
  on public.markets for select
  to anon, authenticated
  using (true);

insert into public.markets (code, country_code, intl_locale, currency, is_active) values
  ('nl', 'NL', 'nl-NL', 'EUR', true),
  ('es', 'ES', 'es-ES', 'EUR', false);
