-- =====================================================================
-- Nexaris — Migration 0004_themes
-- Fase: P1.2 — Games Context Foundations
-- Scopo: tabella `themes` (temi/preset, inclusi i premium) legata al gioco.
--        `themes.layout` adotta lo SCHEMA LAYOUT V2 (contratto ufficiale).
-- Dipende da: 0001_extensions (gen_random_uuid, set_updated_at),
--             0002_core_identity (profiles, is_admin),
--             0003_games (games).
-- NON crea: overlays, teams, leaderboard, creators, access_codes.
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) THEMES — temi/preset applicabili agli overlay
-- =====================================================================
create table if not exists public.themes (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null
                  references public.games (id) on delete restrict,
  author_id     uuid
                  references public.profiles (id) on delete set null,
  slug          text not null,
  name          text not null,
  is_premium    boolean not null default false,
  is_published  boolean not null default false,
  config        jsonb not null default '{}'::jsonb,
  layout        jsonb,
  assets        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- slug univoco per gioco
  constraint themes_game_slug_unique unique (game_id, slug),
  constraint themes_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- layout, se presente, deve essere un oggetto jsonb (schema Layout V2)
  constraint themes_layout_is_object
    check (layout is null or jsonb_typeof(layout) = 'object')
);

comment on table public.themes is
  'Nexaris: temi/preset (inclusi premium). layout = schema Layout V2 ufficiale.';
comment on column public.themes.author_id is
  'Autore (creator/admin). NULL = tema di sistema.';
comment on column public.themes.layout is
  'Schema Layout V2: { canvas:{width,height}, elements:{badge,rank,score,player,brand:{x,y,w,h,fontSize,z}} }.';
comment on column public.themes.config is
  'Config stile/colori di default applicata dall''overlay.';

-- updated_at automatico
drop trigger if exists trg_themes_updated_at on public.themes;
create trigger trg_themes_updated_at
  before update on public.themes
  for each row execute function public.set_updated_at();

-- indici
create index if not exists idx_themes_game_published
  on public.themes (game_id, is_published);
create index if not exists idx_themes_author
  on public.themes (author_id);

-- =====================================================================
-- 2) RLS
--    - lettura: temi pubblicati (pubblico) OPPURE autore OPPURE admin
--    - insert : autore = utente loggato (o admin)
--    - update/delete: autore o admin
-- =====================================================================
alter table public.themes enable row level security;

drop policy if exists themes_select_published_or_owner on public.themes;
create policy themes_select_published_or_owner on public.themes
  for select using (
    is_published
    or author_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists themes_insert_owner on public.themes;
create policy themes_insert_owner on public.themes
  for insert with check (
    author_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists themes_update_owner_or_admin on public.themes;
create policy themes_update_owner_or_admin on public.themes
  for update using (author_id = auth.uid() or public.is_admin())
              with check (author_id = auth.uid() or public.is_admin());

drop policy if exists themes_delete_owner_or_admin on public.themes;
create policy themes_delete_owner_or_admin on public.themes
  for delete using (author_id = auth.uid() or public.is_admin());

-- =====================================================================
-- Fine 0004_themes
-- =====================================================================
