begin;

create or replace function private.prevent_organization_creator_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'organization creator cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger organizations_prevent_creator_change
before update on public.organizations
for each row execute function private.prevent_organization_creator_change();

commit;
