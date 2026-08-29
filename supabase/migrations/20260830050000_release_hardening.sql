begin;

create or replace function public.list_guest_gallery(
  event_slug text,
  guest_token_hash text,
  cursor_created_at timestamptz default null,
  cursor_id uuid default null,
  page_size integer default 30
)
returns table (id uuid, storage_path text, capture_mode public.media_capture_mode, template_id text, width integer, height integer, created_at timestamptz)
language sql security definer set search_path = '' as $$
  with authorized_event as (
    select e.id
    from public.events e
    join public.event_settings es on es.event_id = e.id and es.gallery_enabled
    where e.slug = event_slug and e.status::text in ('active', 'ended') and e.deleted_at is null
      and exists (
        select 1 from public.guest_sessions requester
        where requester.event_id = e.id and requester.token_hash = guest_token_hash
          and requester.status = 'active' and requester.revoked_at is null
          and requester.expires_at > statement_timestamp()
      )
    limit 1
  )
  select m.id, m.storage_path, m.capture_mode, m.template_id, m.width, m.height, m.created_at
  from public.media_assets m
  join authorized_event ae on ae.id = m.event_id
  where m.status = 'ready' and m.visibility = 'visible' and m.deleted_at is null
    and (cursor_created_at is null or (m.created_at, m.id) < (cursor_created_at, cursor_id))
  order by m.created_at desc, m.id desc
  limit least(greatest(page_size, 1), 50);
$$;

revoke update on table public.event_settings from authenticated;
grant update (guest_uploads_enabled, gallery_enabled) on public.event_settings to authenticated;

revoke update on table public.media_assets from authenticated;
drop policy if exists "media_assets_update_admins" on public.media_assets;

create or replace function private.guard_media_asset_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.event_id is distinct from old.event_id
    or new.guest_session_id is distinct from old.guest_session_id
    or new.storage_path is distinct from old.storage_path
    or new.media_type is distinct from old.media_type
    or new.capture_mode is distinct from old.capture_mode
    or new.template_id is distinct from old.template_id
    or new.mime_type is distinct from old.mime_type
    or new.byte_size is distinct from old.byte_size
    or new.width is distinct from old.width
    or new.height is distinct from old.height
    or new.created_at is distinct from old.created_at then
    raise exception 'media identity fields are immutable' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'pending' and new.status in ('ready', 'failed'))
    or (old.status = 'ready' and new.status = 'archived')
  ) then
    raise exception 'invalid media status transition' using errcode = '22023';
  end if;

  if new.status = 'archived' and new.visibility <> 'hidden' then
    raise exception 'archived media must remain hidden' using errcode = '22023';
  end if;
  return new;
end; $$;

create trigger media_assets_guard_update
before update on public.media_assets for each row execute function private.guard_media_asset_update();

create or replace function public.set_event_media_visibility(
  requested_media_id uuid,
  requested_visibility public.media_visibility
)
returns table (media_id uuid, visibility public.media_visibility)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.media_assets m set visibility = requested_visibility
  from public.events e
  where m.id = requested_media_id and m.event_id = e.id
    and m.status = 'ready' and m.deleted_at is null
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = e.organization_id and om.user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
    )
  returning m.id, m.visibility;
end; $$;

create or replace function public.archive_event_media(requested_media_id uuid)
returns table (media_id uuid, storage_path text)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.media_assets m
  set status = 'archived', visibility = 'hidden', deleted_at = statement_timestamp()
  from public.events e
  where m.id = requested_media_id and m.event_id = e.id
    and m.status = 'ready' and m.deleted_at is null
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = e.organization_id and om.user_id = (select auth.uid())
        and om.role in ('owner', 'admin')
    )
  returning m.id, m.storage_path;
end; $$;

revoke all on function public.set_event_media_visibility(uuid,public.media_visibility) from public;
revoke all on function public.archive_event_media(uuid) from public;
grant execute on function public.set_event_media_visibility(uuid,public.media_visibility) to authenticated;
grant execute on function public.archive_event_media(uuid) to authenticated;

drop function public.resolve_media_finalize(text,text,uuid);
create function public.resolve_media_finalize(
  event_slug text,
  guest_token_hash text,
  requested_media_id uuid
)
returns table (media_id uuid, storage_path text, expected_byte_size bigint, expected_mime_type text, media_status public.media_asset_status)
language sql security definer set search_path = '' as $$
  select m.id, m.storage_path, m.byte_size, m.mime_type, m.status
  from public.media_assets m
  join public.events e on e.id = m.event_id
  join public.guest_sessions gs on gs.id = m.guest_session_id
  where e.slug = event_slug and e.status::text = 'active' and e.deleted_at is null
    and gs.token_hash = guest_token_hash and gs.status = 'active' and gs.revoked_at is null
    and gs.expires_at > statement_timestamp() and m.id = requested_media_id
    and (m.status = 'ready' or (m.status = 'pending' and m.upload_expires_at > statement_timestamp()));
$$;
revoke all on function public.resolve_media_finalize(text,text,uuid) from public;
grant execute on function public.resolve_media_finalize(text,text,uuid) to anon, authenticated;

create table private.join_rate_limits (
  scope text not null check (scope ~ '^[a-z0-9_-]{1,50}$'),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  count integer not null check (count > 0),
  primary key (scope, key_hash)
);
create index join_rate_limits_window_idx on private.join_rate_limits(window_started_at);
revoke all on table private.join_rate_limits from public, anon, authenticated;

create or replace function public.consume_join_rate_limit(
  requested_scope text,
  requested_key_hash text,
  window_seconds integer default 600,
  max_attempts integer default 20
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql security definer set search_path = '' as $$
declare
  current_row private.join_rate_limits%rowtype;
  current_time timestamptz := statement_timestamp();
begin
  if requested_scope !~ '^[a-z0-9_-]{1,50}$' or requested_key_hash !~ '^[0-9a-f]{64}$'
    or window_seconds not between 60 and 3600 or max_attempts not between 1 and 100 then
    raise exception 'invalid rate limit request' using errcode = '22023';
  end if;

  insert into private.join_rate_limits (scope, key_hash, window_started_at, count)
  values (requested_scope, requested_key_hash, current_time, 1)
  on conflict (scope, key_hash) do update set
    window_started_at = case
      when private.join_rate_limits.window_started_at + make_interval(secs => window_seconds) <= current_time then current_time
      else private.join_rate_limits.window_started_at end,
    count = case
      when private.join_rate_limits.window_started_at + make_interval(secs => window_seconds) <= current_time then 1
      else private.join_rate_limits.count + 1 end
  returning * into current_row;

  return query select
    current_row.count <= max_attempts,
    case when current_row.count <= max_attempts then 0 else greatest(1, ceil(extract(epoch from (current_row.window_started_at + make_interval(secs => window_seconds) - current_time)))::integer) end;
end; $$;

revoke all on function public.consume_join_rate_limit(text,text,integer,integer) from public;
grant execute on function public.consume_join_rate_limit(text,text,integer,integer) to service_role;

commit;
