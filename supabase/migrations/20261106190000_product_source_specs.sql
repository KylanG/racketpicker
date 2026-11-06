-- RP-83: raw specifications per product and source (bol for now), so the mapping to
-- racket_specs can be improved later without asking the source again. Internal only:
-- no rights for anon/authenticated; service_role gets them via default privileges.
create table public.product_source_specs (
  product_id uuid not null references public.products (id) on delete cascade,
  source text not null check (source ~ '^[a-z0-9-]+$'),
  -- [{ "group", "key", "name", "value" }]; empty array when the source had none
  specs jsonb not null default '[]' check (jsonb_typeof(specs) = 'array'),
  -- spec names no mapping rule could use, for review
  unmapped text[] not null default '{}',
  fetched_at timestamptz not null default now(),
  primary key (product_id, source)
);

alter table public.product_source_specs enable row level security;

comment on table public.product_source_specs is
  'RP-83: raw product specifications per source, mapped into racket_specs where unambiguous.';
