-- =====================================================================
-- Nexaris — Migration 0005_overlays
-- Fase: P1.3 — Creative Core (catalogo overlay)
-- Scopo: tabella `overlays` = CATALOGO di overlay/template (curati,
--        premium o pubblici), agganciati a un gioco e a un tema.
--        `layout_v2` adotta lo SCHEMA LAYOUT V2 (contratto ufficiale).
-- Relazioni: un gioco -> molti overlay; un overlay -> molti progetti.
-- Dipende da: 0001_extensions, 0002_core_identity (is_admin),
--             0003_games (games), 0004_themes (themes).
-- NON crea: access_codes, entitlements, teams, creators, leaderboards.
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) OVERLAYS — catalogo template overlay
-- =====================================================================
create table if not exists public.overlays (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null
                   references public.games (id) on delete restrict,
  theme_id       uuid
                   references public.themes (id) on delete set null,
  slug           text not null unique,
  name           text not null,
  category       text,
  layout_v2      jsonb not null,
  preview_image  text,
  version        integer not null default 1,
  is_premium     boolean not null default false,
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint overlays_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- contratto Layout V2: deve essere un oggetto jsonb
  constraint overlays_layout_v2_is_object
    check (jsonb_typeof(layout_v2) = 'object')
);

comment on table public.overlays is
  'Nexaris: catalogo overlay/template (un gioco -> molti overlay).';
comment on column public.overlays.layout_v2 is
  'Schema Layout V2 ufficiale: { canvas:{width,height}, elements:{badge,rank,score,player,brand:{x,y,w,h,fontSize,z}} }.';
comment on column public.overlays.category is
  'Categoria libera (es. ranked, minimal, premium, tournament).';
comment on column public.overlays.version is
  'Revisione del template di catalogo (incrementale).';

-- updated_at automatico
drop trigger if exists trg_overlays_updated_at on public.overlays;
create trigger trg_overlays_updated_at
  before update on public.overlays
  for each row execute function public.set_updated_at();

-- indici
create index if not exists idx_overlays_game     on public.overlays (game_id);
create index if not exists idx_overlays_theme    on public.overlays (theme_id);
create index if not exists idx_overlays_category on public.overlays (category);
create index if not exists idx_overlays_public   on public.overlays (is_public);

-- =====================================================================
-- 2) RLS
--    - lettura: overlay pubblici (pubblico) OPPURE admin
--    - scrittura: solo admin (catalogo curato)
-- =====================================================================
alter table public.overlays enable row level security;

drop policy if exists overlays_select_public_or_admin on public.overlays;
create policy overlays_select_public_or_admin on public.overlays
  for select using (is_public or public.is_admin());

drop policy if exists overlays_write_admin on public.overlays;
create policy overlays_write_admin on public.overlays
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Fine 0005_overlays
-- =====================================================================
