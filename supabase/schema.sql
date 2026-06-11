-- ═════════════════════════════════════════════════════════════════════════════
-- Spectral — Supabase schema
--
-- Run this once in the Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Idempotent: safe to re-run.
--
-- Access model:
--   • The Vercel API uses the service-role key (bypasses RLS) for all writes.
--   • articles / sources / categories are publicly readable (harmless metadata).
--   • user_favorites is service-role only — no public policies.
-- ═════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── categories ───────────────────────────────────────────────────────────────
create table if not exists public.categories (
  slug       text primary key,
  name       text not null,
  region     text not null check (region in ('world', 'brazil')),
  color      text not null default '#94a3b8',
  created_at timestamptz not null default now()
);

-- ── sources ──────────────────────────────────────────────────────────────────
create table if not exists public.sources (
  slug            text primary key,
  name            text not null,
  region          text not null check (region in ('world', 'brazil')),
  tier            smallint not null default 2 check (tier in (1, 2)),
  homepage        text,
  why             text,
  last_fetched_at timestamptz,
  last_error      text,
  created_at      timestamptz not null default now()
);

-- ── articles ─────────────────────────────────────────────────────────────────
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  hash          text not null unique,
  title         text not null,
  url           text not null,
  source_slug   text not null references public.sources (slug) on delete cascade,
  source_name   text not null,
  category_slug text not null references public.categories (slug),
  region        text not null check (region in ('world', 'brazil')),
  summary       text,
  image_url     text,
  author        text,
  published_at  timestamptz not null,
  fetched_at    timestamptz not null default now(),
  tier          smallint not null default 2 check (tier in (1, 2)),
  -- 'simple' config handles the mixed EN/PT corpus without stemming surprises
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, ''))
  ) stored
);

-- Fast-query indexes (category, recency, source, credibility, region, search)
create index if not exists articles_published_at_idx on public.articles (published_at desc);
create index if not exists articles_category_idx     on public.articles (category_slug, published_at desc);
create index if not exists articles_source_idx       on public.articles (source_slug, published_at desc);
create index if not exists articles_region_idx       on public.articles (region, published_at desc);
create index if not exists articles_tier_idx         on public.articles (tier);
create index if not exists articles_fts_idx          on public.articles using gin (fts);

-- ── user_favorites ───────────────────────────────────────────────────────────
-- Keyed by an anonymous per-browser device id. `article` snapshots the full
-- card so favorites survive article pruning. `user_id` is reserved for a
-- future Supabase Auth integration.
create table if not exists public.user_favorites (
  id           uuid primary key default gen_random_uuid(),
  device_id    text not null,
  user_id      uuid,
  article_hash text not null,
  article      jsonb not null,
  created_at   timestamptz not null default now(),
  unique (device_id, article_hash)
);

create index if not exists user_favorites_device_idx on public.user_favorites (device_id, created_at desc);

-- ── retention ────────────────────────────────────────────────────────────────
-- Keep the newest `keep_count` articles (default well above the 500 minimum).
-- Called by the API after every refresh; returns the number of rows deleted.
create or replace function public.prune_articles(keep_count integer default 1200)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if keep_count < 500 then
    keep_count := 500;
  end if;

  with victims as (
    select id
    from public.articles
    order by published_at desc
    offset keep_count
  )
  delete from public.articles a
  using victims v
  where a.id = v.id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ── row-level security ───────────────────────────────────────────────────────
alter table public.categories     enable row level security;
alter table public.sources        enable row level security;
alter table public.articles       enable row level security;
alter table public.user_favorites enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "public read sources" on public.sources;
create policy "public read sources"
  on public.sources for select
  to anon, authenticated
  using (true);

drop policy if exists "public read articles" on public.articles;
create policy "public read articles"
  on public.articles for select
  to anon, authenticated
  using (true);

-- user_favorites: intentionally NO anon/authenticated policies.
-- Only the service-role key (used by the Vercel API) can read or write it.

-- ── seed: categories ─────────────────────────────────────────────────────────
-- (Kept in sync with shared/categories.ts; the API also upserts these on
--  every refresh, so drift self-heals.)
insert into public.categories (slug, name, region, color) values
  ('technology-ai',           'Technology & AI',          'world',  '#a78bfa'),
  ('politics-government',     'Politics & Government',    'world',  '#60a5fa'),
  ('business-markets',        'Business & Markets',       'world',  '#34d399'),
  ('science-health',          'Science & Health',         'world',  '#22d3ee'),
  ('climate-environment',     'Climate & Environment',    'world',  '#a3e635'),
  ('international-conflicts', 'International Conflicts',  'world',  '#fb7185'),
  ('space-astronomy',         'Space & Astronomy',        'world',  '#818cf8'),
  ('br-politics',             'Brazilian Politics',       'brazil', '#facc15'),
  ('br-economy',              'Economy & Inflation',      'brazil', '#4ade80'),
  ('br-justice',              'Crime & Justice',          'brazil', '#f87171'),
  ('br-education',            'Education',                'brazil', '#38bdf8'),
  ('br-regional',             'Regional News',            'brazil', '#fb923c'),
  ('br-tech',                 'Tech Innovation',          'brazil', '#e879f9')
on conflict (slug) do update
  set name = excluded.name, region = excluded.region, color = excluded.color;
