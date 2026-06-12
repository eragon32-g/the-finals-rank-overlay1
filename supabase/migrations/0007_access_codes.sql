-- =====================================================================
-- Nexaris — Migration 0007_access_codes
-- Fase: P1.4 — Access & Entitlement System
-- Scopo: inventario ufficiale dei codici accesso Nexaris (multi-uso,
--        tipizzati). Sostituisce public.ranktag_access_codes (legacy).
-- Dipende da: 0001_extensions (citext, gen_random_uuid, set_updated_at),
--             0002_core_identity (profiles, is_admin).
-- NON crea: teams, creators, leaderboards.
-- Idempotente dove possibile.
-- =====================================================================

create table if not exists public.access_codes (
  id              uuid primary key default gen_random_uuid(),
  code            citext not null unique,
  type            text not null,
  duration_ms     bigint,
  max_redemptions integer not null default 1,
  redeemed_count  integer not null default 0,
  is_active       boolean not null default true,
  note            text,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint access_codes_type_check
    check (type in ('trial','permanent','premium','creator','team','admin')),
  constraint access_codes_max_redemptions_check
    check (max_redemptions >= 1),
  constraint access_codes_redeemed_count_nonneg
    check (redeemed_count >= 0),
  constraint access_codes_redeemed_le_max
    check (redeemed_count <= max_redemptions)
);

comment on table public.access_codes is
  'Nexaris: inventario codici accesso (sostituisce ranktag_access_codes legacy).';
comment on column public.access_codes.type is
  'trial | permanent | premium | creator | team | admin.';
comment on column public.access_codes.duration_ms is
  'Durata accesso temporaneo in ms. NULL = nessuna scadenza (usato per permanent).';
comment on column public.access_codes.max_redemptions is
  'Numero massimo di riscatti (1 = single-use, >1 = giveaway).';

-- updated_at automatico
drop trigger if exists trg_access_codes_updated_at on public.access_codes;
create trigger trg_access_codes_updated_at
  before update on public.access_codes
  for each row execute function public.set_updated_at();

-- indici
create index if not exists idx_access_codes_active on public.access_codes (is_active);
create index if not exists idx_access_codes_type   on public.access_codes (type);

-- =====================================================================
-- RLS — solo admin (creazione/gestione dal pannello Admin).
--   Il riscatto da parte dell'utente NON passa da SELECT diretta:
--   avviene tramite la RPC redeem_code() (security definer, in 0009).
-- =====================================================================
alter table public.access_codes enable row level security;

drop policy if exists access_codes_admin_all on public.access_codes;
create policy access_codes_admin_all on public.access_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Fine 0007_access_codes
-- =====================================================================
