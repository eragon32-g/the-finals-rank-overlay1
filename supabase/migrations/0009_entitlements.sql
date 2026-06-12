-- =====================================================================
-- Nexaris — Migration 0009_entitlements
-- Fase: P1.4 — Access & Entitlement System
-- Scopo: diritti di accesso effettivi (entitlements) + funzioni server-side
--          redeem_code(text)
--          has_active_entitlement(text)
--          has_active_entitlement(text, text, uuid)
--        Sostituisce ranktag_user_access + ranktag_redeem_access_code (legacy).
-- Dipende da: 0001_extensions, 0002_core_identity (profiles),
--             0007_access_codes, 0008_code_redemptions.
-- Le scritture su entitlements avvengono SOLO via RPC / service role.
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) ENTITLEMENTS — diritti di accesso attivi
-- =====================================================================
create table if not exists public.entitlements (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles (id) on delete cascade,
  source_redemption_id  uuid references public.code_redemptions (id) on delete set null,
  scope                 text not null,
  resource_type         text,
  resource_id           uuid,
  starts_at             timestamptz not null default now(),
  expires_at            timestamptz,
  is_active             boolean not null default true,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint entitlements_scope_check
    check (scope in (
      'platform_access','studio_access','premium_themes',
      'creator_tools','team_tools','admin_tools'
    ))
);

comment on table public.entitlements is
  'Nexaris: diritti di accesso effettivi (sostituisce ranktag_user_access legacy).';
comment on column public.entitlements.scope is
  'platform_access | studio_access | premium_themes | creator_tools | team_tools | admin_tools.';
comment on column public.entitlements.resource_type is
  'Opzionale: tipo risorsa specifica (es. overlay, theme). NULL = grant generale.';

-- updated_at automatico
drop trigger if exists trg_entitlements_updated_at on public.entitlements;
create trigger trg_entitlements_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- indici
create index if not exists idx_entitlements_profile on public.entitlements (profile_id);
create index if not exists idx_entitlements_scope   on public.entitlements (profile_id, scope, expires_at);
create index if not exists idx_entitlements_active  on public.entitlements (is_active);
create index if not exists idx_entitlements_resource on public.entitlements (resource_type, resource_id);

-- =====================================================================
-- 2) RLS — lettura dal proprietario o admin; scritture dirette bloccate
-- =====================================================================
alter table public.entitlements enable row level security;

drop policy if exists entitlements_select_owner_admin on public.entitlements;
create policy entitlements_select_owner_admin on public.entitlements
  for select using (profile_id = auth.uid() or public.is_admin());

-- Nessuna policy INSERT/UPDATE/DELETE: scritture solo via RPC / service role.

-- =====================================================================
-- 3) FUNZIONE: has_active_entitlement(scope)
--    true se l'utente loggato ha un entitlement attivo e non scaduto.
-- =====================================================================
create or replace function public.has_active_entitlement(input_scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.entitlements e
    where e.profile_id = auth.uid()
      and e.scope = input_scope
      and e.is_active
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

comment on function public.has_active_entitlement(text) is
  'Nexaris: true se l''utente loggato ha un entitlement attivo per lo scope.';

-- =====================================================================
-- 4) FUNZIONE: has_active_entitlement(scope, resource_type, resource_id)
--    Un grant generale (resource_type/id NULL) copre qualsiasi risorsa;
--    altrimenti deve combaciare la risorsa specifica.
-- =====================================================================
create or replace function public.has_active_entitlement(
  input_scope text,
  input_resource_type text,
  input_resource_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.entitlements e
    where e.profile_id = auth.uid()
      and e.scope = input_scope
      and e.is_active
      and (e.expires_at is null or e.expires_at > now())
      and (
        (e.resource_type is null and e.resource_id is null)
        or (e.resource_type = input_resource_type and e.resource_id = input_resource_id)
      )
  );
$$;

comment on function public.has_active_entitlement(text, text, uuid) is
  'Nexaris: come sopra, ma vincolato a una risorsa specifica (o grant generale).';

-- =====================================================================
-- 5) FUNZIONE: redeem_code(input_code)
--    Server-side, security definer. Identità presa da auth.uid().
--    Mappa type -> scope dell'entitlement principale:
--      trial     -> studio_access
--      permanent -> platform_access
--      premium   -> premium_themes
--      creator   -> creator_tools
--      team      -> team_tools
--      admin     -> admin_tools
-- =====================================================================
create or replace function public.redeem_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_code       public.access_codes%rowtype;
  v_expires    timestamptz;
  v_scope      text;
  v_redemption uuid;
  v_entitlement uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth_required',
      'message', 'Autenticazione richiesta.');
  end if;

  if input_code is null or btrim(input_code) = '' then
    return jsonb_build_object('ok', false, 'error', 'code_empty',
      'message', 'Codice mancante.');
  end if;

  -- lock di riga per evitare riscatti concorrenti oltre il limite
  select * into v_code
  from public.access_codes
  where code = btrim(input_code)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'code_not_found',
      'message', 'Codice non trovato.');
  end if;

  if not v_code.is_active then
    return jsonb_build_object('ok', false, 'error', 'code_inactive',
      'message', 'Codice disattivato.');
  end if;

  if v_code.redeemed_count >= v_code.max_redemptions then
    return jsonb_build_object('ok', false, 'error', 'code_exhausted',
      'message', 'Codice esaurito.');
  end if;

  -- doppio riscatto stesso utente/stesso codice
  if exists (
    select 1 from public.code_redemptions
    where code_id = v_code.id and profile_id = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed',
      'message', 'Hai già riscattato questo codice.');
  end if;

  -- scadenza: null se permanent, altrimenti calcolata da duration_ms
  if v_code.type = 'permanent' then
    v_expires := null;
  elsif v_code.duration_ms is not null then
    v_expires := now() + make_interval(secs => v_code.duration_ms::numeric / 1000.0);
  else
    v_expires := null;
  end if;

  -- mappa type -> scope principale
  v_scope := case v_code.type
    when 'trial'     then 'studio_access'
    when 'permanent' then 'platform_access'
    when 'premium'   then 'premium_themes'
    when 'creator'   then 'creator_tools'
    when 'team'      then 'team_tools'
    when 'admin'     then 'admin_tools'
    else 'platform_access'
  end;

  -- 1) registra il riscatto
  insert into public.code_redemptions (code_id, profile_id, expires_at)
  values (v_code.id, v_uid, v_expires)
  returning id into v_redemption;

  -- 2) incrementa il contatore (il CHECK garantisce <= max_redemptions)
  update public.access_codes
  set redeemed_count = redeemed_count + 1,
      updated_at = now()
  where id = v_code.id;

  -- 3) crea l'entitlement principale coerente col type
  insert into public.entitlements (profile_id, source_redemption_id, scope, expires_at, is_active)
  values (v_uid, v_redemption, v_scope, v_expires, true)
  returning id into v_entitlement;

  return jsonb_build_object(
    'ok', true,
    'redemption_id', v_redemption,
    'entitlement_id', v_entitlement,
    'type', v_code.type,
    'scope', v_scope,
    'expires_at', v_expires
  );
end;
$$;

comment on function public.redeem_code(text) is
  'Nexaris: riscatta un codice (auth.uid()), crea redemption + entitlement. Sostituisce ranktag_redeem_access_code.';

-- =====================================================================
-- 6) GRANTS — esecuzione solo per utenti autenticati (+ service_role)
-- =====================================================================
revoke execute on function public.redeem_code(text) from public;
revoke execute on function public.has_active_entitlement(text) from public;
revoke execute on function public.has_active_entitlement(text, text, uuid) from public;

grant execute on function public.redeem_code(text) to authenticated, service_role;
grant execute on function public.has_active_entitlement(text) to authenticated, service_role;
grant execute on function public.has_active_entitlement(text, text, uuid) to authenticated, service_role;

-- =====================================================================
-- Fine 0009_entitlements
-- =====================================================================
