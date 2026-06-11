-- RankTag: codici accesso server-side
-- Esegui in Supabase → SQL Editor → Run (una volta)

create table if not exists public.ranktag_access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('permanent', 'temporary')),
  duration_ms bigint,
  note text,
  disabled boolean not null default false,
  used_by text,
  used_nickname text,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ranktag_user_access (
  user_id text primary key,
  nickname text,
  code text references public.ranktag_access_codes(code),
  type text not null check (type in ('permanent', 'temporary')),
  redeemed_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists ranktag_access_codes_used_by_idx on public.ranktag_access_codes(used_by);
create index if not exists ranktag_user_access_expires_idx on public.ranktag_user_access(expires_at);

alter table public.ranktag_access_codes enable row level security;
alter table public.ranktag_user_access enable row level security;

-- Solo service role (API Vercel) accede alle tabelle
create policy "service only codes" on public.ranktag_access_codes
  for all using (false) with check (false);

create policy "service only user access" on public.ranktag_user_access
  for all using (false) with check (false);

create or replace function public.ranktag_redeem_access_code(
  p_code text,
  p_user_id text,
  p_nickname text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.ranktag_access_codes%rowtype;
  v_expires timestamptz;
begin
  select * into v_code
  from public.ranktag_access_codes
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Codice non trovato.');
  end if;

  if v_code.disabled then
    return jsonb_build_object('ok', false, 'message', 'Codice disattivato.');
  end if;

  if v_code.used_by is not null and v_code.used_by <> lower(trim(p_user_id)) then
    return jsonb_build_object('ok', false, 'message', 'Codice già utilizzato da un altro account.');
  end if;

  if v_code.used_by = lower(trim(p_user_id)) then
    return jsonb_build_object('ok', false, 'message', 'Hai già riscattato questo codice.');
  end if;

  if v_code.type = 'temporary' then
    v_expires := now() + make_interval(secs => coalesce(v_code.duration_ms, 86400000) / 1000.0);
  end if;

  update public.ranktag_access_codes
  set used_by = lower(trim(p_user_id)),
      used_nickname = trim(p_nickname),
      used_at = now(),
      expires_at = v_expires
  where id = v_code.id;

  insert into public.ranktag_user_access (user_id, nickname, code, type, redeemed_at, expires_at)
  values (lower(trim(p_user_id)), trim(p_nickname), v_code.code, v_code.type, now(), v_expires)
  on conflict (user_id) do update set
    nickname = excluded.nickname,
    code = excluded.code,
    type = excluded.type,
    redeemed_at = excluded.redeemed_at,
    expires_at = excluded.expires_at;

  return jsonb_build_object(
    'ok', true,
    'access', jsonb_build_object(
      'code', v_code.code,
      'type', v_code.type,
      'duration_ms', v_code.duration_ms,
      'redeemed_at', now(),
      'expires_at', v_expires
    )
  );
end;
$$;

create or replace function public.ranktag_check_user_access(p_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ranktag_user_access%rowtype;
begin
  select * into v_row
  from public.ranktag_user_access
  where user_id = lower(trim(p_user_id));

  if not found then
    return jsonb_build_object('ok', true, 'active', false);
  end if;

  if v_row.type = 'permanent' then
    return jsonb_build_object('ok', true, 'active', true, 'type', 'permanent');
  end if;

  if v_row.expires_at is not null and v_row.expires_at <= now() then
    return jsonb_build_object('ok', true, 'active', false, 'reason', 'expired');
  end if;

  return jsonb_build_object(
    'ok', true,
    'active', true,
    'type', 'temporary',
    'expires_at', v_row.expires_at
  );
end;
$$;

grant execute on function public.ranktag_redeem_access_code(text, text, text) to service_role;
grant execute on function public.ranktag_check_user_access(text) to service_role;
