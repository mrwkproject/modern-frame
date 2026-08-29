begin;

create type public.guest_session_status as enum ('active', 'revoked');

create table public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token_hash text not null,
  status public.guest_session_status not null default 'active',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint guest_sessions_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint guest_sessions_revocation_consistent check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create unique index guest_sessions_token_hash_key on public.guest_sessions(token_hash);
create index guest_sessions_event_id_idx on public.guest_sessions(event_id);
create index guest_sessions_valid_lookup_idx
  on public.guest_sessions(event_id, token_hash, expires_at)
  where status = 'active';

alter table public.guest_sessions enable row level security;
revoke all on table public.guest_sessions from anon, authenticated;

create or replace function public.create_guest_session(
  event_slug text,
  guest_token_hash text
)
returns table (expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  session_expires_at timestamptz;
begin
  if guest_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid guest token hash' using errcode = '22023';
  end if;

  select e.* into target_event
  from public.events e
  where e.slug = event_slug
    and e.status::text = 'active'
    and e.deleted_at is null
  limit 1;

  if not found then
    raise exception 'event is not available for guest sessions' using errcode = '22023';
  end if;

  session_expires_at := coalesce(
    target_event.ends_at + interval '24 hours',
    statement_timestamp() + interval '7 days'
  );

  if session_expires_at <= statement_timestamp() then
    raise exception 'event guest session window has closed' using errcode = '22023';
  end if;

  insert into public.guest_sessions (event_id, token_hash, expires_at)
  values (target_event.id, guest_token_hash, session_expires_at);

  return query select session_expires_at;
end;
$$;

create or replace function public.validate_guest_session(
  event_slug text,
  guest_token_hash text
)
returns table (valid boolean, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_expires_at timestamptz;
begin
  if guest_token_hash !~ '^[0-9a-f]{64}$' then
    return query select false, null::timestamptz;
    return;
  end if;

  update public.guest_sessions gs
  set last_seen_at = statement_timestamp()
  from public.events e
  where gs.event_id = e.id
    and e.slug = event_slug
    and e.status::text = 'active'
    and e.deleted_at is null
    and gs.token_hash = guest_token_hash
    and gs.status = 'active'
    and gs.revoked_at is null
    and gs.expires_at > statement_timestamp()
  returning gs.expires_at into session_expires_at;

  return query select session_expires_at is not null, session_expires_at;
end;
$$;

revoke all on function public.create_guest_session(text, text) from public;
revoke all on function public.validate_guest_session(text, text) from public;
grant execute on function public.create_guest_session(text, text) to anon, authenticated;
grant execute on function public.validate_guest_session(text, text) to anon, authenticated;

commit;
