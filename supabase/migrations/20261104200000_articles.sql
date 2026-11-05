-- RP-51: blog articles per market (Blogs & tips).
-- Body is Markdown (subset: ## / ### headings, paragraphs, lists, **bold**, [links](/path)),
-- rendered by the app without raw HTML.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  market_code text not null references public.markets (code),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 10 and 120),
  intro text not null,
  body text not null default '',
  -- Sport tab on the blog; null = general (shown as "Algemeen").
  sport_key text references public.sports (key),
  -- Category the article links to, e.g. rackets.
  related_category text references public.categories (key),
  author text not null default 'Redactie Racketpicker',
  published_on date,
  updated_on date,
  reading_minutes smallint not null default 5 check (reading_minutes between 1 and 60),
  -- Path of a licensed image under /public (e.g. /blog/racketvorm.webp); null = no photo.
  hero_image text check (hero_image is null or hero_image ~ '^/[a-z0-9/_.-]+$'),
  hero_image_alt text,
  meta_description text check (meta_description is null or char_length(meta_description) <= 170),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_code, slug),
  check (not is_published or published_on is not null),
  check (hero_image is null or hero_image_alt is not null)
);
create index articles_market_published_idx on public.articles (market_code, published_on desc)
  where is_published;
create trigger articles_set_updated_at before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;
grant select on public.articles to anon, authenticated;

create policy "Published articles are public" on public.articles
  for select to anon, authenticated
  using (is_published and published_on <= current_date);
