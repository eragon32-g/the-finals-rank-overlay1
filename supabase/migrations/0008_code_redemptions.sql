-- =====================================================================
-- Nexaris — Migration 0008_code_redemptions
-- Fase: P1.4 — Access & Entitlement System
-- Scopo: audit dei riscatti codice (un riscatto per coppia codice/utente).
--        Sostituisce lo stato d'uso "dentro la riga" del legacy
--        (ranktag_access_codes.used_by/used_at).
-- Dipende da: 0001_extensions, 0002_core_identity (profiles),
--             0007_access_codes (access_codes).
-- Le scritture avvengono SOLO via RPC redeem_code() (0009).
-- Idempotente dove possibile.
-- =====================================================================

create table if not exists public.code_redemptions (
  id           uuid primary key default gen_random_uuid(),
  code_id      uuid not null references public.access_codes (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  expires_at   timestamptz,
  metadata     jsonb not null default '{}'::jsonb,
  -- un utente può riscattare un dato codice una sola volta
  constraint code_redemptions_unique unique (code_id, profile_id)
);

comment on table public.code_redemptions is
  'Nexaris: audit riscatti codice. Scritture solo via RPC redeem_code().';

-- indici richiesti
create index if not exists idx_code_redemptions_profile on public.code_redemptions (profile_id);
create index if not exists idx_code_redemptions_expires on public.code_redemptions (expires_at);

-- =====================================================================
-- RLS — lettura dal proprietario o admin; scritture dirette bloccate
--   (insert/update/delete avvengono solo tramite RPC security definer).
-- =====================================================================
alter table public.code_redemptions enable row level security;

drop policy if exists code_redemptions_select_owner_admin on public.code_redemptions;
create policy code_redemptions_select_owner_admin on public.code_redemptions
  for select using (profile_id = auth.uid() or public.is_admin());

-- Nessuna policy INSERT/UPDATE/DELETE: con RLS attiva i client NON possono
-- scrivere direttamente. La RPC redeem_code() (security definer) bypassa la RLS.

-- =====================================================================
-- Fine 0008_code_redemptions
-- =====================================================================
