begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create type public.organization_role as enum ('owner', 'admin', 'member');
create type public.event_status as enum ('draft', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 100),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint organizations_slug_key unique (slug)
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.event_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint events_valid_dates check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint events_organization_slug_key unique (organization_id, slug)
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index events_organization_id_status_idx on public.events(organization_id, status) where deleted_at is null;
create index events_starts_at_idx on public.events(starts_at) where deleted_at is null;

create or replace function private.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function private.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function private.set_updated_at();

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'display_name', 100), ''));
  return new;
end; $$;
create trigger auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_organization_id and m.user_id = (select auth.uid()));
$$;

create or replace function private.is_org_admin(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_organization_id and m.user_id = (select auth.uid()) and m.role in ('owner', 'admin'));
$$;

create or replace function private.is_org_owner(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members m where m.organization_id = target_organization_id and m.user_id = (select auth.uid()) and m.role = 'owner');
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_admin(uuid) from public;
revoke all on function private.is_org_owner(uuid) from public;
grant execute on function private.is_org_member(uuid), private.is_org_admin(uuid), private.is_org_owner(uuid) to authenticated;

create or replace function private.add_organization_owner() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.organization_members (organization_id, user_id, role) values (new.id, new.created_by, 'owner'); return new; end; $$;
create trigger organizations_add_owner after insert on public.organizations for each row execute function private.add_organization_owner();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.events enable row level security;

create policy "profiles_select_self" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_self" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "organizations_select_members" on public.organizations for select to authenticated using (private.is_org_member(id));
create policy "organizations_insert_authenticated" on public.organizations for insert to authenticated with check (created_by = (select auth.uid()));
create policy "organizations_update_admins" on public.organizations for update to authenticated using (private.is_org_admin(id)) with check (private.is_org_admin(id));

create policy "organization_members_select_members" on public.organization_members for select to authenticated using (private.is_org_member(organization_id));
create policy "organization_members_insert_owners" on public.organization_members for insert to authenticated with check (private.is_org_owner(organization_id));
create policy "organization_members_update_owners" on public.organization_members for update to authenticated using (private.is_org_owner(organization_id)) with check (private.is_org_owner(organization_id));
create policy "organization_members_delete_owners" on public.organization_members for delete to authenticated using (private.is_org_owner(organization_id) and not (user_id = (select auth.uid()) and role = 'owner'));

create policy "events_select_members" on public.events for select to authenticated using (private.is_org_member(organization_id));
create policy "events_insert_members" on public.events for insert to authenticated with check (private.is_org_member(organization_id) and created_by = (select auth.uid()));
create policy "events_update_admins" on public.events for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "events_delete_admins" on public.events for delete to authenticated using (private.is_org_admin(organization_id));

commit;
