begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('81000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release-owner-a@example.test','',now(),'{}','{}',now(),now()),
('82000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release-owner-b@example.test','',now(),'{}','{}',now(),now()),
('83000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release-admin-a@example.test','',now(),'{}','{}',now(),now()),
('84000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release-member-a@example.test','',now(),'{}','{}',now(),now());
insert into public.organizations(id,name,slug,created_by) values
('8a000000-0000-0000-0000-000000000001','Release Org A','release-org-a','81000000-0000-0000-0000-000000000001'),
('8b000000-0000-0000-0000-000000000002','Release Org B','release-org-b','82000000-0000-0000-0000-000000000002');
insert into public.organization_members(organization_id,user_id,role) values
('8a000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000003','admin'),
('8a000000-0000-0000-0000-000000000001','84000000-0000-0000-0000-000000000004','member');
insert into public.events(id,organization_id,name,slug,status,event_type,timezone,ends_at,created_by) values
('8a100000-0000-0000-0000-000000000001','8a000000-0000-0000-0000-000000000001','Release Event A','release-event-a','active','other','UTC',now()+interval '1 day','81000000-0000-0000-0000-000000000001'),
('8b100000-0000-0000-0000-000000000001','8b000000-0000-0000-0000-000000000002','Release Event B','release-event-b','active','other','UTC',now()+interval '1 day','82000000-0000-0000-0000-000000000002');
insert into public.guest_sessions(id,event_id,token_hash,expires_at) values
('8a110000-0000-0000-0000-000000000001','8a100000-0000-0000-0000-000000000001',repeat('a',64),now()+interval '1 day'),
('8a120000-0000-0000-0000-000000000002','8a100000-0000-0000-0000-000000000001',repeat('b',64),now()+interval '1 day'),
('8b110000-0000-0000-0000-000000000001','8b100000-0000-0000-0000-000000000001',repeat('c',64),now()+interval '1 day');

insert into public.media_assets(id,event_id,guest_session_id,storage_path,capture_mode,template_id,mime_type,byte_size,width,height,status,visibility,ready_at,deleted_at) values
('8a200000-0000-0000-0000-000000000001','8a100000-0000-0000-0000-000000000001','8a110000-0000-0000-0000-000000000001','events/8a100000-0000-0000-0000-000000000001/8a200000-0000-0000-0000-000000000001.jpg','single','clean-ivory','image/jpeg',1000,1080,1440,'ready','visible',now(),null),
('8a200000-0000-0000-0000-000000000002','8a100000-0000-0000-0000-000000000001','8a120000-0000-0000-0000-000000000002','events/8a100000-0000-0000-0000-000000000001/8a200000-0000-0000-0000-000000000002.jpg','booth3','classic-2x6','image/jpeg',1000,600,1800,'ready','visible',now(),null),
('8a200000-0000-0000-0000-000000000003','8a100000-0000-0000-0000-000000000001','8a110000-0000-0000-0000-000000000001','events/8a100000-0000-0000-0000-000000000001/8a200000-0000-0000-0000-000000000003.jpg','single','clean-ivory','image/jpeg',1000,1080,1440,'ready','hidden',now(),null),
('8a200000-0000-0000-0000-000000000004','8a100000-0000-0000-0000-000000000001','8a110000-0000-0000-0000-000000000001','events/8a100000-0000-0000-0000-000000000001/8a200000-0000-0000-0000-000000000004.jpg','single','clean-ivory','image/jpeg',1000,1080,1440,'failed','visible',null,null),
('8a200000-0000-0000-0000-000000000005','8a100000-0000-0000-0000-000000000001','8a110000-0000-0000-0000-000000000001','events/8a100000-0000-0000-0000-000000000001/8a200000-0000-0000-0000-000000000005.jpg','single','clean-ivory','image/jpeg',1000,1080,1440,'pending','visible',null,null),
('8a200000-0000-0000-0000-000000000006','8a100000-0000-0000-0000-000000000001','8a110000-0000-0000-0000-000000000001','events/8a100000-0000-0000-0000-000000000001/8a200000-0000-0000-0000-000000000006.jpg','single','clean-ivory','image/jpeg',1000,1080,1440,'archived','hidden',now(),now());

set local role anon;
select is((select count(*) from public.list_guest_gallery('release-event-a',repeat('a',64),null,null,50)),2::bigint,'Guest A sees both same-event ready visible assets');
select is((select count(*) from public.list_guest_gallery('release-event-a',repeat('b',64),null,null,50)),2::bigint,'Guest B sees both same-event ready visible assets');
select is((select count(*) from public.list_guest_gallery('release-event-a',repeat('a',64),null,null,50) where id='8a200000-0000-0000-0000-000000000002'),1::bigint,'Guest A sees Guest B media');
select is((select count(*) from public.list_guest_gallery('release-event-a',repeat('b',64),null,null,50) where id='8a200000-0000-0000-0000-000000000001'),1::bigint,'Guest B sees Guest A media');
select is_empty($$select * from public.list_guest_gallery('release-event-a',repeat('c',64),null,null,50)$$,'Event B guest cannot see Event A gallery');
select is_empty($$select * from public.resolve_media_finalize('release-event-a',repeat('b',64),'8a200000-0000-0000-0000-000000000001')$$,'Another same-event guest cannot finalize creator media');
select is((select media_status from public.resolve_media_finalize('release-event-a',repeat('a',64),'8a200000-0000-0000-0000-000000000001')),'ready'::public.media_asset_status,'Ready finalize resolves idempotently for its creator');

set local role authenticated;
select set_config('request.jwt.claim.sub','83000000-0000-0000-0000-000000000003',true);
select lives_ok($$update public.event_settings set guest_uploads_enabled=false,gallery_enabled=false where event_id='8a100000-0000-0000-0000-000000000001'$$,'Admin can toggle both product settings');
select throws_ok($$update public.event_settings set event_id='8b100000-0000-0000-0000-000000000001' where event_id='8a100000-0000-0000-0000-000000000001'$$,'42501','permission denied for table event_settings','Authenticated callers cannot mutate event identity');
select throws_ok($$update public.event_settings set created_at=now() where event_id='8a100000-0000-0000-0000-000000000001'$$,'42501','permission denied for table event_settings','Authenticated callers cannot forge timestamps');
select throws_ok($$update public.media_assets set storage_path='forged.jpg' where id='8a200000-0000-0000-0000-000000000001'$$,'42501','permission denied for table media_assets','Admin has no generic media metadata update');
select is((select count(*) from public.set_event_media_visibility('8a200000-0000-0000-0000-000000000001','hidden')),1::bigint,'Own-tenant admin visibility RPC succeeds');
select is_empty($$select * from public.set_event_media_visibility('8a200000-0000-0000-0000-000000000004','hidden')$$,'Visibility RPC rejects non-ready media');

select set_config('request.jwt.claim.sub','84000000-0000-0000-0000-000000000004',true);
select is_empty($$update public.event_settings set gallery_enabled=true where event_id='8a100000-0000-0000-0000-000000000001' returning event_id$$,'Member cannot manage settings');
select is_empty($$select * from public.set_event_media_visibility('8a200000-0000-0000-0000-000000000002','hidden')$$,'Member cannot moderate visibility');
select is_empty($$select * from public.archive_event_media('8a200000-0000-0000-0000-000000000002')$$,'Member cannot archive media');

select set_config('request.jwt.claim.sub','82000000-0000-0000-0000-000000000002',true);
select is_empty($$update public.event_settings set gallery_enabled=true where event_id='8a100000-0000-0000-0000-000000000001' returning event_id$$,'Cross-tenant owner cannot manage settings');
select is_empty($$select * from public.set_event_media_visibility('8a200000-0000-0000-0000-000000000002','hidden')$$,'Cross-tenant owner cannot moderate visibility');
select is_empty($$select * from public.archive_event_media('8a200000-0000-0000-0000-000000000002')$$,'Cross-tenant owner cannot archive media');

reset role;
select throws_ok($$update public.media_assets set status='ready',ready_at=now() where id='8a200000-0000-0000-0000-000000000004'$$,'22023','invalid media status transition','Failed media cannot transition to ready');
select throws_ok($$update public.media_assets set visibility='visible' where id='8a200000-0000-0000-0000-000000000006'$$,'22023','archived media must remain hidden','Archived media cannot become visible');

set local role authenticated;
select set_config('request.jwt.claim.sub','83000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.archive_event_media('8a200000-0000-0000-0000-000000000002')),1::bigint,'Own-tenant admin archive RPC succeeds');

reset role;
set local role service_role;
select is((select allowed from public.consume_join_rate_limit('guest_join',repeat('d',64),600,2)),true,'First distributed join attempt is allowed');
select is((select allowed from public.consume_join_rate_limit('guest_join',repeat('d',64),600,2)),true,'Second distributed join attempt is allowed');
select is((select allowed from public.consume_join_rate_limit('guest_join',repeat('d',64),600,2)),false,'Attempt beyond the distributed threshold is blocked');

select * from finish();
rollback;
