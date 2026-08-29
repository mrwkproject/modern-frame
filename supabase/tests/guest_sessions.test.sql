begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guest-owner-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guest-owner-b@example.test', '', now(), '{}', '{}', now(), now());

insert into public.organizations (id, name, slug, created_by)
values
  ('5a000000-0000-0000-0000-000000000001', 'Guest Org A', 'guest-org-a-test', '51000000-0000-0000-0000-000000000001'),
  ('5b000000-0000-0000-0000-000000000002', 'Guest Org B', 'guest-org-b-test', '52000000-0000-0000-0000-000000000002');

insert into public.events (id, organization_id, name, slug, status, event_type, timezone, ends_at, created_by, deleted_at)
values
  ('5a100000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000001', 'Active Guest Event', 'active-guest-event-test', 'active', 'other', 'UTC', now() + interval '2 days', '51000000-0000-0000-0000-000000000001', null),
  ('5a200000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-000000000001', 'Draft Guest Event', 'draft-guest-event-test', 'draft', 'other', 'UTC', null, '51000000-0000-0000-0000-000000000001', null),
  ('5a300000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000001', 'Ended Guest Event', 'ended-guest-event-test', 'ended', 'other', 'UTC', null, '51000000-0000-0000-0000-000000000001', null),
  ('5a400000-0000-0000-0000-000000000004', '5a000000-0000-0000-0000-000000000001', 'Archived Guest Event', 'archived-guest-event-test', 'archived', 'other', 'UTC', null, '51000000-0000-0000-0000-000000000001', null),
  ('5a500000-0000-0000-0000-000000000005', '5a000000-0000-0000-0000-000000000001', 'Deleted Guest Event', 'deleted-guest-event-test', 'active', 'other', 'UTC', null, '51000000-0000-0000-0000-000000000001', now()),
  ('5b100000-0000-0000-0000-000000000001', '5b000000-0000-0000-0000-000000000002', 'Active Guest Event B', 'active-guest-event-b-test', 'active', 'other', 'UTC', null, '52000000-0000-0000-0000-000000000002', null);

set local role anon;
select throws_ok($$select * from public.guest_sessions$$, '42501', 'permission denied for table guest_sessions', 'Anon cannot SELECT guest_sessions');
select throws_ok($$insert into public.guest_sessions (event_id, token_hash, expires_at) values ('5a100000-0000-0000-0000-000000000001', repeat('1', 64), now() + interval '1 day')$$, '42501', 'permission denied for table guest_sessions', 'Anon cannot INSERT guest_sessions directly');
select throws_ok($$update public.guest_sessions set status = 'revoked'$$, '42501', 'permission denied for table guest_sessions', 'Anon cannot UPDATE guest_sessions directly');
select throws_ok($$delete from public.guest_sessions$$, '42501', 'permission denied for table guest_sessions', 'Anon cannot DELETE guest_sessions directly');

select lives_ok($$select * from public.create_guest_session('active-guest-event-test', repeat('a', 64))$$, 'Anon can create a session through the narrow RPC for an active event');
select throws_ok($$select * from public.create_guest_session('draft-guest-event-test', repeat('b', 64))$$, '22023', 'event is not available for guest sessions', 'Session creation rejects draft events');
select throws_ok($$select * from public.create_guest_session('ended-guest-event-test', repeat('c', 64))$$, '22023', 'event is not available for guest sessions', 'Session creation rejects ended events');
select throws_ok($$select * from public.create_guest_session('archived-guest-event-test', repeat('d', 64))$$, '22023', 'event is not available for guest sessions', 'Session creation rejects archived events');
select throws_ok($$select * from public.create_guest_session('deleted-guest-event-test', repeat('e', 64))$$, '22023', 'event is not available for guest sessions', 'Session creation rejects deleted events');
select throws_ok($$select * from public.create_guest_session('active-guest-event-test', 'raw-secret-not-a-hash')$$, '22023', 'invalid guest token hash', 'Invalid token hash format is rejected');
select results_eq($$select valid from public.validate_guest_session('active-guest-event-test', repeat('a', 64))$$, $$values (true)$$, 'A valid hash validates for its event');
select results_eq($$select valid from public.validate_guest_session('active-guest-event-b-test', repeat('a', 64))$$, $$values (false)$$, 'An Event A session cannot validate for Event B');

reset role;
select is_empty($$select id from public.guest_sessions where token_hash = 'raw-secret-not-a-hash'$$, 'The database never stores the raw token value');
update public.guest_sessions set expires_at = now() - interval '1 minute' where token_hash = repeat('a', 64);
set local role anon;
select results_eq($$select valid from public.validate_guest_session('active-guest-event-test', repeat('a', 64))$$, $$values (false)$$, 'Expired sessions fail validation');

reset role;
update public.guest_sessions set expires_at = now() + interval '1 day', status = 'revoked', revoked_at = now() where token_hash = repeat('a', 64);
set local role anon;
select results_eq($$select valid from public.validate_guest_session('active-guest-event-test', repeat('a', 64))$$, $$values (false)$$, 'Revoked sessions fail validation');

set local role authenticated;
select set_config('request.jwt.claim.sub', '52000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"52000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select throws_ok($$select token_hash from public.guest_sessions$$, '42501', 'permission denied for table guest_sessions', 'Hosts cannot obtain guest token hashes through table access');

select * from finish();
rollback;
