-- =====================================================================
-- Nexaris — Migration 0006_projects
-- Fase: P1.3 — Creative Core (progetti utente)
-- Scopo: tabella `projects` = creazioni dell'utente (output dello Studio).
--        `layout_data` adotta lo SCHEMA LAYOUT V2 (contratto ufficiale).
-- Relazioni: un utente -> molti progetti; un overlay -> molti progetti.
-- Target futuro: lo Studio salverà direttamente qui (insert per owner).
-- Dipende da: 0001_extensions, 0002_core_identity (profiles, is_admin),
--             0003_games (games), 0005_overlays (overlays).
-- NON crea: access_codes, entitlements, teams, creators, leaderboards.
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) PROJECTS — overlay creati/salvati dall'utente
-- =====================================================================
create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null
                   references public.profiles (id) on delete cascade,
  game_id        uuid not null
                   references public.games (id) on delete restrict,
  overlay_id     uuid
                   references public.overlays (id) on delete set null,
  name           text not null,
  description    text,
  layout_data    jsonb not null,
  preview_image  text,
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- contratto Layout V2: deve essere un oggetto jsonb
  constraint projects_layout_data_is_object
    check (jsonb_typeof(layout_data) = 'object')
);

comment on table public.projects is
  'Nexaris: progetti utente (output Studio). un utente -> molti progetti.';
comment on column public.projects.overlay_id is
  'Overlay di catalogo da cui deriva il progetto (NULL = creato da zero).';
comment on column public.projects.layout_data is
  'Snapshot di lavoro in schema Layout V2 (canvas + elements).';

-- updated_at automatico
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- indici
create index if not exists idx_projects_owner   on public.projects (owner_id);
create index if not exists idx_projects_game    on public.projects (game_id);
create index if not exists idx_projects_overlay on public.projects (overlay_id);
create index if not exists idx_projects_public  on public.projects (is_public);

-- =====================================================================
-- 2) RLS
--    - lettura: proprietario OPPURE progetto pubblico OPPURE admin
--    - insert : owner_id = utente loggato  (futuro Studio salva qui)
--    - update/delete: proprietario o admin
--    NB: il gate "licenza/entitlement" sarà aggiunto in una fase
--        successiva (access_codes/entitlements non ancora creati).
-- =====================================================================
alter table public.projects enable row level security;

drop policy if exists projects_select_owner_public_admin on public.projects;
create policy projects_select_owner_public_admin on public.projects
  for select using (
    owner_id = auth.uid()
    or is_public
    or public.is_admin()
  );

drop policy if exists projects_insert_owner on public.projects;
create policy projects_insert_owner on public.projects
  for insert with check (owner_id = auth.uid());

drop policy if exists projects_update_owner_or_admin on public.projects;
create policy projects_update_owner_or_admin on public.projects
  for update using (owner_id = auth.uid() or public.is_admin())
              with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists projects_delete_owner_or_admin on public.projects;
create policy projects_delete_owner_or_admin on public.projects
  for delete using (owner_id = auth.uid() or public.is_admin());

-- =====================================================================
-- Fine 0006_projects
-- =====================================================================
