-- =====================================================================
-- Nexaris — Migration 0003_games
-- Fase: P1.2 — Games Context Foundations
-- Scopo: tabella di contesto multi-gioco `games`.
--        Overlay, temi, codici, entitlement e leaderboard si agganceranno
--        a questa tabella nelle fasi successive.
-- Dipende da: 0001_extensions (pgcrypto, set_updated_at),
--             0002_core_identity (is_admin per le policy RLS).
-- NON crea: overlays, teams, leaderboard, creators, access_codes.
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) GAMES — contesto gioco (oggi solo THE FINALS)
-- =====================================================================
create table if not exists public.games (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  is_active           boolean not null default true,
  leaderboard_config  jsonb not null default '{}'::jsonb,
  badge_set           jsonb not null default '{}'::jsonb,
  default_canvas      jsonb not null default '{"width":470,"height":160}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint games_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.games is
  'Nexaris: contesto gioco. Predispone la piattaforma al multi-gioco.';
comment on column public.games.leaderboard_config is
  'Config proxy leaderboard (base URL, stagioni, piattaforme) — ex api/player.js.';
comment on column public.games.badge_set is
  'Mapping league -> asset stemma (ex iconFromLeague).';
comment on column public.games.default_canvas is
  'Canvas di default dell''overlay per il gioco (schema Layout V2).';

-- updated_at automatico
drop trigger if exists trg_games_updated_at on public.games;
create trigger trg_games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- indici
create index if not exists idx_games_is_active on public.games (is_active);

-- =====================================================================
-- 2) SEED — gioco iniziale: THE FINALS
-- =====================================================================
insert into public.games (slug, name, is_active, leaderboard_config, badge_set, default_canvas)
values (
  'the-finals',
  'THE FINALS',
  true,
  jsonb_build_object(
    'base_url', 'https://api.the-finals-leaderboard.com/v1/leaderboard',
    'default_season', 's10',
    'default_platform', 'crossplay'
  ),
  jsonb_build_object(
    'leagues', jsonb_build_array(
      'unranked','bronze','silver','gold','platinum','diamond','ruby'
    )
  ),
  jsonb_build_object('width', 470, 'height', 160)
)
on conflict (slug) do nothing;

-- =====================================================================
-- 3) RLS — lettura pubblica, scrittura solo admin
-- =====================================================================
alter table public.games enable row level security;

drop policy if exists games_select_public on public.games;
create policy games_select_public on public.games
  for select using (true);

drop policy if exists games_write_admin on public.games;
create policy games_write_admin on public.games
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Fine 0003_games
-- =====================================================================
