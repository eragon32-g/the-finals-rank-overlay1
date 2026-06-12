-- =====================================================================
-- Nexaris — Migration 0001_extensions
-- Fase: P1.1 — Database Foundations
-- Scopo: estensioni richieste + funzioni helper di base (senza dipendenze
--        da tabelle applicative). Nessuna tabella creata qui.
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Estensioni
-- ---------------------------------------------------------------------
-- gen_random_uuid() per le primary key uuid
create extension if not exists pgcrypto with schema extensions;

-- citext: identificatori case-insensitive (nickname, codici, player name)
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------
-- 2) Helper di base (dependency-free)
-- ---------------------------------------------------------------------

-- current_profile_id(): id del profilo loggato (alias semantico di auth.uid()).
-- Usato in seguito dalle policy RLS per leggibilità.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- set_updated_at(): trigger generico, mantiene updated_at = now() su UPDATE.
-- Riutilizzabile da qualunque tabella con colonna updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.current_profile_id() is
  'Nexaris: id del profilo autenticato (alias di auth.uid()).';
comment on function public.set_updated_at() is
  'Nexaris: trigger generico, aggiorna updated_at a now() su UPDATE.';

-- =====================================================================
-- Fine 0001_extensions
-- =====================================================================
