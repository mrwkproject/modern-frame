begin;

alter type public.event_status rename value 'published' to 'active';
alter type public.event_status add value if not exists 'ended' before 'archived';

create type public.event_type as enum (
  'wedding',
  'birthday',
  'graduation',
  'corporate',
  'conference',
  'concert',
  'community',
  'brand_activation',
  'other'
);

alter table public.events
  add column description text check (description is null or char_length(description) <= 1000),
  add column event_type public.event_type not null default 'other',
  add column timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  add column cover_image_path text;

create unique index events_public_slug_key
  on public.events(slug)
  where deleted_at is null;

create or replace function private.prevent_event_ownership_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.created_by is distinct from old.created_by then
    raise exception 'event ownership cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger events_prevent_ownership_change
before update on public.events
for each row execute function private.prevent_event_ownership_change();

create or replace function private.validate_event_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not (
    (old.status::text = 'draft' and new.status::text in ('active', 'archived'))
    or (old.status::text = 'active' and new.status::text = 'ended')
    or (old.status::text = 'ended' and new.status::text = 'archived')
  ) then
    raise exception 'invalid event status transition' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger events_validate_status_transition
before update on public.events
for each row execute function private.validate_event_status_transition();

drop policy if exists "events_insert_members" on public.events;
drop policy if exists "events_delete_admins" on public.events;

create policy "events_insert_admins"
on public.events
for insert
to authenticated
with check (
  private.is_org_admin(organization_id)
  and created_by = (select auth.uid())
);

create or replace function public.get_public_event_by_slug(event_slug text)
returns table (
  slug text,
  name text,
  description text,
  event_type public.event_type,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  status public.event_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.slug,
    e.name,
    e.description,
    e.event_type,
    e.starts_at,
    e.ends_at,
    e.timezone,
    e.status
  from public.events e
  where e.slug = event_slug
    and e.deleted_at is null
    and e.status <> 'archived'
  limit 1;
$$;

revoke all on function public.get_public_event_by_slug(text) from public;
grant execute on function public.get_public_event_by_slug(text) to anon, authenticated;

commit;
