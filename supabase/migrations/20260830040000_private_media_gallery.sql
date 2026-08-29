begin;

create type public.media_capture_mode as enum ('single', 'booth3');
create type public.media_asset_status as enum ('pending', 'ready', 'failed', 'archived');
create type public.media_visibility as enum ('visible', 'hidden');

create table public.event_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  guest_uploads_enabled boolean not null default true,
  gallery_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.event_settings (event_id)
select id from public.events
on conflict (event_id) do nothing;

create or replace function private.add_event_settings()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.event_settings (event_id) values (new.id);
  return new;
end; $$;

create trigger events_add_settings
after insert on public.events for each row execute function private.add_event_settings();
create trigger event_settings_set_updated_at
before update on public.event_settings for each row execute function private.set_updated_at();

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_session_id uuid references public.guest_sessions(id) on delete set null,
  storage_path text not null unique,
  media_type text not null default 'photo' check (media_type = 'photo'),
  capture_mode public.media_capture_mode not null,
  template_id text not null check (template_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  mime_type text not null check (mime_type = 'image/jpeg'),
  byte_size bigint not null check (byte_size between 1 and 8388608),
  width integer not null check (width between 320 and 8192),
  height integer not null check (height between 320 and 8192),
  status public.media_asset_status not null default 'pending',
  visibility public.media_visibility not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ready_at timestamptz,
  upload_expires_at timestamptz not null default (now() + interval '15 minutes'),
  deleted_at timestamptz,
  constraint media_assets_path_format check (
    storage_path = 'events/' || event_id::text || '/' || id::text || '.jpg'
  ),
  constraint media_assets_ready_consistent check (
    (status in ('ready', 'archived') and ready_at is not null)
    or (status in ('pending', 'failed') and ready_at is null)
  )
);

create index media_assets_event_created_idx
  on public.media_assets(event_id, created_at desc, id desc);
create index media_assets_gallery_idx
  on public.media_assets(event_id, status, visibility, created_at desc, id desc)
  where deleted_at is null;
create index media_assets_guest_session_idx on public.media_assets(guest_session_id);
create index media_assets_pending_expiry_idx on public.media_assets(upload_expires_at)
  where status = 'pending';
create trigger media_assets_set_updated_at
before update on public.media_assets for each row execute function private.set_updated_at();

alter table public.event_settings enable row level security;
alter table public.media_assets enable row level security;
revoke all on table public.event_settings, public.media_assets from anon;
grant select on table public.event_settings, public.media_assets to authenticated;
grant update on table public.event_settings, public.media_assets to authenticated;

create policy "event_settings_select_members" on public.event_settings
for select to authenticated using (
  exists (select 1 from public.events e where e.id = event_id and private.is_org_member(e.organization_id))
);
create policy "event_settings_update_admins" on public.event_settings
for update to authenticated using (
  exists (select 1 from public.events e where e.id = event_id and private.is_org_admin(e.organization_id))
) with check (
  exists (select 1 from public.events e where e.id = event_id and private.is_org_admin(e.organization_id))
);
create policy "media_assets_select_members" on public.media_assets
for select to authenticated using (
  exists (select 1 from public.events e where e.id = event_id and private.is_org_member(e.organization_id))
);
create policy "media_assets_update_admins" on public.media_assets
for update to authenticated using (
  exists (select 1 from public.events e where e.id = event_id and private.is_org_admin(e.organization_id))
) with check (
  exists (select 1 from public.events e where e.id = event_id and private.is_org_admin(e.organization_id))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', false, 8388608, array['image/jpeg'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.create_media_upload_intent(
  event_slug text,
  guest_token_hash text,
  requested_capture_mode text,
  requested_template_id text,
  requested_mime_type text,
  requested_byte_size bigint,
  requested_width integer,
  requested_height integer
)
returns table (media_id uuid, storage_path text, upload_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  target_event public.events%rowtype;
  target_session public.guest_sessions%rowtype;
  new_media_id uuid := gen_random_uuid();
  expires_at timestamptz := statement_timestamp() + interval '15 minutes';
begin
  if guest_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid guest session' using errcode = '22023'; end if;
  if requested_mime_type <> 'image/jpeg' then raise exception 'invalid media type' using errcode = '22023'; end if;
  if requested_byte_size < 1 or requested_byte_size > 8388608 then raise exception 'invalid media size' using errcode = '22023'; end if;
  if requested_width not between 320 and 8192 or requested_height not between 320 and 8192 then raise exception 'invalid media dimensions' using errcode = '22023'; end if;
  if requested_template_id !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid template' using errcode = '22023'; end if;
  if requested_capture_mode not in ('single', 'booth3') then raise exception 'invalid capture mode' using errcode = '22023'; end if;
  if (requested_capture_mode = 'single' and requested_template_id not in ('clean-ivory', 'midnight-celebration', 'warm-editorial'))
    or (requested_capture_mode = 'booth3' and requested_template_id not in ('classic-2x6', 'modern-story', 'editorial-trio')) then
    raise exception 'template does not match capture mode' using errcode = '22023';
  end if;

  select e.* into target_event from public.events e
  join public.event_settings s on s.event_id = e.id and s.guest_uploads_enabled
  where e.slug = event_slug and e.status::text = 'active' and e.deleted_at is null limit 1;
  if not found then raise exception 'event uploads are unavailable' using errcode = '22023'; end if;

  select gs.* into target_session from public.guest_sessions gs
  where gs.event_id = target_event.id and gs.token_hash = guest_token_hash
    and gs.status = 'active' and gs.revoked_at is null and gs.expires_at > statement_timestamp() limit 1;
  if not found then raise exception 'invalid guest session' using errcode = '22023'; end if;

  if (select count(*) from public.media_assets m where m.guest_session_id = target_session.id and m.created_at > statement_timestamp() - interval '1 minute') >= 10 then
    raise exception 'upload rate limit reached' using errcode = '22023';
  end if;
  if (select count(*) from public.media_assets m where m.guest_session_id = target_session.id and m.status <> 'failed') >= 250 then
    raise exception 'session upload limit reached' using errcode = '22023';
  end if;

  insert into public.media_assets (id, event_id, guest_session_id, storage_path, capture_mode, template_id, mime_type, byte_size, width, height, upload_expires_at)
  values (new_media_id, target_event.id, target_session.id, 'events/' || target_event.id::text || '/' || new_media_id::text || '.jpg', requested_capture_mode::public.media_capture_mode, requested_template_id, requested_mime_type, requested_byte_size, requested_width, requested_height, expires_at);

  return query select new_media_id, 'events/' || target_event.id::text || '/' || new_media_id::text || '.jpg', expires_at;
end; $$;

create or replace function public.resolve_media_finalize(
  event_slug text,
  guest_token_hash text,
  requested_media_id uuid
)
returns table (media_id uuid, storage_path text, expected_byte_size bigint, expected_mime_type text)
language sql security definer set search_path = '' as $$
  select m.id, m.storage_path, m.byte_size, m.mime_type
  from public.media_assets m
  join public.events e on e.id = m.event_id
  join public.guest_sessions gs on gs.id = m.guest_session_id
  where e.slug = event_slug and e.status::text = 'active' and e.deleted_at is null
    and gs.token_hash = guest_token_hash and gs.status = 'active' and gs.revoked_at is null
    and gs.expires_at > statement_timestamp()
    and m.id = requested_media_id and m.status = 'pending' and m.upload_expires_at > statement_timestamp();
$$;

create or replace function public.list_guest_gallery(
  event_slug text,
  guest_token_hash text,
  cursor_created_at timestamptz default null,
  cursor_id uuid default null,
  page_size integer default 30
)
returns table (id uuid, storage_path text, capture_mode public.media_capture_mode, template_id text, width integer, height integer, created_at timestamptz)
language sql security definer set search_path = '' as $$
  select m.id, m.storage_path, m.capture_mode, m.template_id, m.width, m.height, m.created_at
  from public.media_assets m
  join public.events e on e.id = m.event_id
  join public.event_settings es on es.event_id = e.id and es.gallery_enabled
  join public.guest_sessions gs on gs.id = m.guest_session_id
  where e.slug = event_slug and e.status::text in ('active', 'ended') and e.deleted_at is null
    and gs.event_id = e.id and gs.token_hash = guest_token_hash and gs.status = 'active'
    and gs.revoked_at is null and gs.expires_at > statement_timestamp()
    and m.status = 'ready' and m.visibility = 'visible' and m.deleted_at is null
    and (cursor_created_at is null or (m.created_at, m.id) < (cursor_created_at, cursor_id))
  order by m.created_at desc, m.id desc limit least(greatest(page_size, 1), 50);
$$;

create or replace function public.validate_guest_gallery_session(event_slug text, guest_token_hash text)
returns table (valid boolean, event_status public.event_status, guest_uploads_enabled boolean, gallery_enabled boolean)
language sql security definer set search_path = '' as $$
  select true, e.status, es.guest_uploads_enabled, es.gallery_enabled
  from public.events e join public.event_settings es on es.event_id = e.id
  join public.guest_sessions gs on gs.event_id = e.id
  where e.slug = event_slug and e.status::text in ('active', 'ended') and e.deleted_at is null
    and es.gallery_enabled and gs.token_hash = guest_token_hash and gs.status = 'active'
    and gs.revoked_at is null and gs.expires_at > statement_timestamp() limit 1;
$$;

revoke all on function public.create_media_upload_intent(text,text,text,text,text,bigint,integer,integer) from public;
revoke all on function public.resolve_media_finalize(text,text,uuid) from public;
revoke all on function public.list_guest_gallery(text,text,timestamptz,uuid,integer) from public;
revoke all on function public.validate_guest_gallery_session(text,text) from public;
grant execute on function public.create_media_upload_intent(text,text,text,text,text,bigint,integer,integer) to anon, authenticated;
grant execute on function public.resolve_media_finalize(text,text,uuid) to anon, authenticated;
grant execute on function public.list_guest_gallery(text,text,timestamptz,uuid,integer) to anon, authenticated;
grant execute on function public.validate_guest_gallery_session(text,text) to anon, authenticated;

commit;
