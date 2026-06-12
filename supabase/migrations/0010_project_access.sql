-- =====================================================================
-- Nexaris — Migration 0010_project_access
-- Fase: P1.5 — Project Access Layer
-- Scopo: collegare Entitlements al cuore creativo.
--        - aggiunge a projects i requisiti d'accesso (scope/risorsa)
--        - can_access_project(uuid): ownership | pubblico | entitlement
--        - can_use_overlay(uuid): overlay + theme + entitlement (premium)
-- Catena: utente -> entitlement -> theme premium -> overlay premium -> project
-- Dipende da: 0002 (profiles, is_admin), 0004 (themes), 0005 (overlays),
--             0006 (projects), 0009 (entitlements, has_active_entitlement).
-- NON crea: teams, creators, leaderboards.
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) PROJECTS — requisiti d'accesso
-- =====================================================================
alter table public.projects
  add column if not exists required_scope         text,
  add column if not exists required_resource_type text,
  add column if not exists required_resource_id   uuid;

comment on column public.projects.required_scope is
  'Scope entitlement richiesto per accedere al progetto (NULL = nessun requisito).';
comment on column public.projects.required_resource_type is
  'Opzionale: tipo risorsa per entitlement vincolato (es. overlay, theme).';
comment on column public.projects.required_resource_id is
  'Opzionale: id risorsa per entitlement vincolato.';

-- vincolo scope coerente con entitlements.scope (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_required_scope_check'
  ) then
    alter table public.projects
      add constraint projects_required_scope_check
      check (
        required_scope is null
        or required_scope in (
          'platform_access','studio_access','premium_themes',
          'creator_tools','team_tools','admin_tools'
        )
      );
  end if;
end$$;

create index if not exists idx_projects_required_scope
  on public.projects (required_scope);

-- =====================================================================
-- 2) can_access_project(input_project_id)
--    Ordine: ownership -> admin -> pubblico -> entitlement richiesto.
--    security definer: deve poter leggere anche progetti privati altrui
--    per valutare l'accesso (la RLS nasconderebbe la riga).
-- =====================================================================
create or replace function public.can_access_project(input_project_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_proj public.projects%rowtype;
begin
  select * into v_proj from public.projects where id = input_project_id;
  if not found then
    return false;
  end if;

  -- 1) ownership
  if v_proj.owner_id = auth.uid() then
    return true;
  end if;

  -- override amministratore
  if public.is_admin() then
    return true;
  end if;

  -- 2) visibilità pubblica
  if v_proj.is_public then
    return true;
  end if;

  -- 3) entitlement richiesto (usa has_active_entitlement)
  if v_proj.required_scope is not null then
    if v_proj.required_resource_type is not null
       and v_proj.required_resource_id is not null then
      return public.has_active_entitlement(
        v_proj.required_scope,
        v_proj.required_resource_type,
        v_proj.required_resource_id
      );
    else
      return public.has_active_entitlement(v_proj.required_scope);
    end if;
  end if;

  -- progetto privato senza requisito: nessun accesso ai non-owner
  return false;
end;
$$;

comment on function public.can_access_project(uuid) is
  'Nexaris: accesso a un progetto (ownership | admin | pubblico | entitlement richiesto).';

-- =====================================================================
-- 3) can_use_overlay(input_overlay_id)
--    Combina overlay + theme + entitlement.
--    - admin: sempre consentito
--    - overlay/theme premium: richiede entitlement 'premium_themes'
--      (grant generale o vincolato alla risorsa overlay)
--    - overlay gratuito: utilizzabile se pubblico
-- =====================================================================
create or replace function public.can_use_overlay(input_overlay_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ov            public.overlays%rowtype;
  v_theme_premium boolean := false;
  v_premium       boolean;
begin
  select * into v_ov from public.overlays where id = input_overlay_id;
  if not found then
    return false;
  end if;

  -- override amministratore
  if public.is_admin() then
    return true;
  end if;

  -- premium del tema collegato (se presente)
  if v_ov.theme_id is not null then
    select t.is_premium into v_theme_premium
    from public.themes t where t.id = v_ov.theme_id;
    v_theme_premium := coalesce(v_theme_premium, false);
  end if;

  v_premium := v_ov.is_premium or v_theme_premium;

  if v_premium then
    -- richiede entitlement premium (generale o vincolato all'overlay)
    return public.has_active_entitlement('premium_themes', 'overlay', input_overlay_id);
  end if;

  -- overlay gratuito: utilizzabile se pubblico
  return v_ov.is_public;
end;
$$;

comment on function public.can_use_overlay(uuid) is
  'Nexaris: uso di un overlay (admin | premium via entitlement | gratuito se pubblico).';

-- =====================================================================
-- 4) GRANTS — esecuzione solo per utenti autenticati (+ service_role)
-- =====================================================================
revoke execute on function public.can_access_project(uuid) from public;
revoke execute on function public.can_use_overlay(uuid) from public;

grant execute on function public.can_access_project(uuid) to authenticated, service_role;
grant execute on function public.can_use_overlay(uuid) to authenticated, service_role;

-- =====================================================================
-- Fine 0010_project_access
-- =====================================================================
