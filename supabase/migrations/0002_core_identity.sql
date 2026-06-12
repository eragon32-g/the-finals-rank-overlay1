-- =====================================================================
-- Nexaris — Migration 0002_core_identity
-- Fase: P1.1 — Database Foundations
-- Scopo: identità di base della piattaforma:
--          profiles · roles · user_roles
--        + helper RBAC (has_role, is_admin)
--        + trigger handle_new_user (crea il profilo alla registrazione Auth)
--        + RLS abilitata con policy essenziali.
-- Dipende da: 0001_extensions (pgcrypto, citext, set_updated_at).
-- NON crea: overlays, teams, leaderboard, creators, access_codes (fasi successive).
-- Idempotente dove possibile.
-- =====================================================================

-- =====================================================================
-- 1) PROFILES — estensione 1:1 di auth.users
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key
                  references auth.users (id) on delete cascade,
  nickname      citext not null unique,
  display_name  text,
  avatar_url    text,
  locale        text not null default 'it',
  is_disabled   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint profiles_nickname_len
    check (char_length(nickname::text) between 2 and 32)
);

comment on table public.profiles is
  'Nexaris: profilo applicativo 1:1 con auth.users (sostituisce ranktagUsersV2).';

-- updated_at automatico
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 2) ROLES — tabella lookup dei ruoli RBAC
-- =====================================================================
create table if not exists public.roles (
  key          text primary key,
  description  text
);

comment on table public.roles is
  'Nexaris: chiavi ruolo RBAC (sostituisce admin hardcoded).';

insert into public.roles (key, description) values
  ('user',       'Utente standard'),
  ('creator',    'Creator con profilo pubblico e temi'),
  ('team_owner', 'Proprietario di un team'),
  ('moderator',  'Moderazione feedback e contenuti'),
  ('admin',      'Amministratore della piattaforma')
on conflict (key) do nothing;

-- =====================================================================
-- 3) USER_ROLES — assegnazione ruoli (M:N profiles <-> roles)
-- =====================================================================
create table if not exists public.user_roles (
  profile_id  uuid not null
                references public.profiles (id) on delete cascade,
  role_key    text not null
                references public.roles (key) on delete cascade,
  granted_by  uuid
                references public.profiles (id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (profile_id, role_key)
);

comment on table public.user_roles is
  'Nexaris: ruoli assegnati ai profili.';

create index if not exists idx_user_roles_role_key on public.user_roles (role_key);
create index if not exists idx_user_roles_profile  on public.user_roles (profile_id);

-- =====================================================================
-- 4) HELPER RBAC (security definer per evitare ricorsione RLS)
--    Eseguono come owner della funzione e bypassano la RLS di user_roles,
--    quindi possono essere usati DENTRO le policy senza ciclo infinito.
-- =====================================================================
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where profile_id = auth.uid()
      and role_key = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

comment on function public.has_role(text) is
  'Nexaris: true se l''utente loggato ha il ruolo indicato (bypassa RLS via security definer).';
comment on function public.is_admin() is
  'Nexaris: true se l''utente loggato ha il ruolo admin.';

-- =====================================================================
-- 5) TRIGGER handle_new_user — crea profiles + ruolo base alla registrazione
--    Eseguito dopo l'insert in auth.users. Security definer per poter
--    scrivere in profiles/user_roles bypassando la RLS.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick citext;
begin
  -- nickname da metadata Auth, fallback deterministico se assente
  v_nick := nullif(trim(new.raw_user_meta_data->>'nickname'), '');
  if v_nick is null then
    v_nick := ('user_' || left(replace(new.id::text, '-', ''), 8))::citext;
  end if;

  -- evita collisione di unicità
  if exists (select 1 from public.profiles where nickname = v_nick) then
    v_nick := (v_nick::text || '_' || left(replace(new.id::text, '-', ''), 6))::citext;
  end if;

  insert into public.profiles (id, nickname)
  values (new.id, v_nick)
  on conflict (id) do nothing;

  -- ruolo base 'user'
  insert into public.user_roles (profile_id, role_key)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 6) RLS — abilitazione + policy essenziali (sicuro per default)
-- =====================================================================
alter table public.profiles   enable row level security;
alter table public.roles      enable row level security;
alter table public.user_roles enable row level security;

-- ---- profiles ----
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update using (id = auth.uid() or public.is_admin())
              with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete using (public.is_admin());

-- ---- roles (lookup) ----
drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated on public.roles
  for select using (auth.uid() is not null or public.is_admin());

drop policy if exists roles_write_admin on public.roles;
create policy roles_write_admin on public.roles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- user_roles ----
drop policy if exists user_roles_select_self_or_admin on public.user_roles;
create policy user_roles_select_self_or_admin on public.user_roles
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists user_roles_write_admin on public.user_roles;
create policy user_roles_write_admin on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Fine 0002_core_identity
-- =====================================================================
