begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-a@example.test', '', now(), '{}', '{}', now(), now());

insert into public.organizations (id, name, slug, created_by)
values
  ('a0000000-0000-0000-0000-000000000001', 'Organization A', 'organization-a-test', '10000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'Organization B', 'organization-b-test', '20000000-0000-0000-0000-000000000002');

insert into public.organization_members (organization_id, user_id, role)
values
  ('a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'member'),
  ('a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 'admin');

insert into public.events (
  id, organization_id, name, slug, status, event_type, timezone, created_by
)
values
  ('aa000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Private Event A', 'private-event-a-test', 'active', 'wedding', 'Asia/Jakarta', '10000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Private Event B', 'private-event-b-test', 'active', 'corporate', 'UTC', '20000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq(
  $$select id from public.profiles order by id$$,
  $$values ('10000000-0000-0000-0000-000000000001'::uuid)$$,
  'User A reads only their own profile'
);
select is_empty(
  $$select id from public.profiles where id = '20000000-0000-0000-0000-000000000002'$$,
  'User A cannot read User B profile'
);
select results_eq(
  $$select id from public.organizations order by id$$,
  $$values ('a0000000-0000-0000-0000-000000000001'::uuid)$$,
  'User A reads their organization only'
);
select is_empty(
  $$select id from public.organizations where id = 'b0000000-0000-0000-0000-000000000002'$$,
  'User A cannot read Organization B'
);
select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, role) values ('b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'member')$$,
  '42501',
  'new row violates row-level security policy for table "organization_members"',
  'User A cannot add themselves to Organization B'
);
select throws_ok(
  $$update public.organizations set created_by = '20000000-0000-0000-0000-000000000002' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  '42501',
  'organization creator cannot be changed',
  'Organization ownership identity is immutable'
);
select lives_ok(
  $$update public.organizations set name = 'Organization A Renamed' where id = 'a0000000-0000-0000-0000-000000000001'$$,
  'Authorized organization settings remain editable'
);
select lives_ok(
  $$insert into public.events (organization_id, name, slug, event_type, timezone, created_by) values ('a0000000-0000-0000-0000-000000000001', 'Owner Created Event', 'owner-created-event-test', 'other', 'UTC', '10000000-0000-0000-0000-000000000001')$$,
  'Organization A owner can create Event A'
);
select throws_ok(
  $$insert into public.events (organization_id, name, slug, event_type, timezone, created_by) values ('b0000000-0000-0000-0000-000000000002', 'Cross Tenant Event', 'cross-tenant-event-test', 'other', 'UTC', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  'new row violates row-level security policy for table "events"',
  'Organization A owner cannot create an event for Organization B'
);
select is_empty(
  $$select id from public.events where id = 'bb000000-0000-0000-0000-000000000002'$$,
  'Organization A user cannot read Organization B events'
);
select is_empty(
  $$update public.events set name = 'Compromised' where id = 'bb000000-0000-0000-0000-000000000002' returning id$$,
  'Organization A user cannot update Organization B events'
);

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is_empty(
  $$update public.organization_members set role = 'owner' where organization_id = 'a0000000-0000-0000-0000-000000000001' and user_id = '30000000-0000-0000-0000-000000000003' returning user_id$$,
  'A member cannot promote themselves to owner'
);
select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, role) values ('a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'member')$$,
  '42501',
  'new row violates row-level security policy for table "organization_members"',
  'Membership creation remains owner-only'
);

select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.events (organization_id, name, slug, event_type, timezone, created_by) values ('a0000000-0000-0000-0000-000000000001', 'Admin Created Event', 'admin-created-event-test', 'other', 'UTC', '40000000-0000-0000-0000-000000000004')$$,
  'Organization admin can create an event in their organization'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is_empty(
  $$select id from public.organizations$$,
  'Anonymous users cannot read organizations'
);
select is_empty(
  $$select id from public.events$$,
  'Anonymous users cannot select the underlying events table'
);
select results_eq(
  $$select slug from public.get_public_event_by_slug('private-event-a-test')$$,
  $$values ('private-event-a-test'::text)$$,
  'Anonymous public event access works through the safe RPC'
);
select is_empty(
  $$select slug from public.get_public_event_by_slug('missing-event-test')$$,
  'The public RPC does not invent unavailable events'
);
select is(
  (select count(*) from public.get_public_event_by_slug('private-event-a-test')),
  1::bigint,
  'The public projection returns a single safe event row'
);

select * from finish();
rollback;
