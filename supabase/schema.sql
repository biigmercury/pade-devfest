-- Pàdé schema. Paste this whole file into the Supabase SQL editor and run it.
-- Safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 24),
  emoji       text not null check (char_length(emoji) between 1 and 16),
  interests   text[] not null default '{}' check (cardinality(interests) between 1 and 3),
  goal        text not null check (char_length(goal) <= 40),
  fun_pick    text not null check (char_length(fun_pick) <= 40),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.matches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  matched_user_id  uuid not null references public.profiles(id) on delete cascade,
  icebreaker       text not null default '' check (char_length(icebreaker) <= 600),
  found            boolean not null default false,
  created_at       timestamptz not null default now(),
  constraint matches_pair_unique unique (user_id, matched_user_id),
  constraint matches_not_self check (user_id <> matched_user_id)
);

-- Indexes
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
-- Serves "matches by user" lookups, the met list and the per-user rate limit.
create index if not exists matches_user_id_idx on public.matches (user_id, created_at desc);
-- Serves "who matched with me" lookups.
create index if not exists matches_matched_user_id_idx on public.matches (matched_user_id, created_at desc);
create index if not exists matches_found_idx on public.matches (found) where found;

-- Row level security: on, with no policies for anon/authenticated.
-- All reads and writes go through the Next.js API routes using the service role key,
-- which bypasses RLS. The anon key can read nothing.
alter table public.profiles enable row level security;
alter table public.matches  enable row level security;

-- One round trip for the /live stats endpoint.
create or replace function public.pade_stats()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'people',  (select count(*) from public.profiles where not is_demo),
    'demo',    (select count(*) from public.profiles where is_demo),
    'matches', (select count(*) from public.matches),
    'found',   (select count(*) from public.matches where found)
  );
$$;

revoke all on function public.pade_stats() from public, anon, authenticated;
grant execute on function public.pade_stats() to service_role;
