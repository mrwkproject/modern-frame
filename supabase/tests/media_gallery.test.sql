begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('71000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','media-a@example.test','',now(),'{}','{}',now(),now()),
('72000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','media-b@example.test','',now(),'{}','{}',now(),now()),
('73000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','media-member@example.test','',now(),'{}','{}',now(),now());
insert into public.organizations (id,name,slug,created_by) values
('7a000000-0000-0000-0000-000000000001','Media Org A','media-org-a-test','71000000-0000-0000-0000-000000000001'),
('7b000000-0000-0000-0000-000000000002','Media Org B','media-org-b-test','72000000-0000-0000-0000-000000000002');
insert into public.organization_members (organization_id,user_id,role) values ('7a000000-0000-0000-0000-000000000001','73000000-0000-0000-0000-000000000003','member');
insert into public.events (id,organization_id,name,slug,status,event_type,timezone,ends_at,created_by) values
('7a100000-0000-0000-0000-000000000001','7a000000-0000-0000-0000-000000000001','Media Active A','media-active-a-test','active','other','UTC',now()+interval '1 day','71000000-0000-0000-0000-000000000001'),
('7a200000-0000-0000-0000-000000000002','7a000000-0000-0000-0000-000000000001','Media Ended A','media-ended-a-test','ended','other','UTC',now()-interval '1 hour','71000000-0000-0000-0000-000000000001'),
('7b100000-0000-0000-0000-000000000001','7b000000-0000-0000-0000-000000000002','Media Active B','media-active-b-test','active','other','UTC',now()+interval '1 day','72000000-0000-0000-0000-000000000002');
insert into public.guest_sessions (id,event_id,token_hash,expires_at) values
('7a110000-0000-0000-0000-000000000001','7a100000-0000-0000-0000-000000000001',repeat('a',64),now()+interval '1 day'),
('7a210000-0000-0000-0000-000000000002','7a200000-0000-0000-0000-000000000002',repeat('b',64),now()+interval '1 day');

select is((select public from storage.buckets where id='event-media'), false, 'Event media bucket is private');
select is((select file_size_limit from storage.buckets where id='event-media'), 8388608::bigint, 'Bucket enforces the 8 MiB limit');
select is((select gallery_enabled from public.event_settings where event_id='7a100000-0000-0000-0000-000000000001'),true,'New events receive default settings');

set local role anon;
select throws_ok($$select * from public.media_assets$$,'42501','permission denied for table media_assets','Anon cannot select media rows');
select throws_ok($$insert into public.media_assets(event_id,storage_path,capture_mode,template_id,mime_type,byte_size,width,height) values('7a100000-0000-0000-0000-000000000001','bad','single','clean-ivory','image/jpeg',100,1080,1440)$$,'42501','permission denied for table media_assets','Anon cannot insert media rows');
select throws_ok($$update public.media_assets set visibility='hidden'$$,'42501','permission denied for table media_assets','Anon cannot update media rows');
select throws_ok($$delete from public.media_assets$$,'42501','permission denied for table media_assets','Anon cannot delete media rows');
select lives_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','clean-ivory','image/jpeg',120000,1080,1440)$$,'Valid guest can create an upload intent');
select throws_ok($$select * from public.create_media_upload_intent('media-active-b-test',repeat('a',64),'single','clean-ivory','image/jpeg',120000,1080,1440)$$,'22023','invalid guest session','Cross-event token is rejected');
select throws_ok($$select * from public.create_media_upload_intent('media-ended-a-test',repeat('b',64),'single','clean-ivory','image/jpeg',120000,1080,1440)$$,'22023','event uploads are unavailable','Ended event capture remains blocked');
select throws_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','clean-ivory','image/png',120000,1080,1440)$$,'22023','invalid media type','Non-JPEG upload is rejected');
select throws_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','clean-ivory','image/jpeg',9000000,1080,1440)$$,'22023','invalid media size','Oversized upload is rejected');
select throws_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','clean-ivory','image/jpeg',120000,20,20)$$,'22023','invalid media dimensions','Invalid dimensions are rejected');
select throws_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','classic-2x6','image/jpeg',120000,1080,1440)$$,'22023','template does not match capture mode','Mode and template pairing is enforced in the database');

reset role;
update public.event_settings set guest_uploads_enabled=false where event_id='7a100000-0000-0000-0000-000000000001';
set local role anon;
select throws_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','clean-ivory','image/jpeg',120000,1080,1440)$$,'22023','event uploads are unavailable','Disabled guest uploads are enforced');
reset role;
update public.event_settings set guest_uploads_enabled=true where event_id='7a100000-0000-0000-0000-000000000001';

with generated as (select gen_random_uuid() as id from generate_series(1,9))
insert into public.media_assets(id,event_id,guest_session_id,storage_path,capture_mode,template_id,mime_type,byte_size,width,height)
select id,'7a100000-0000-0000-0000-000000000001','7a110000-0000-0000-0000-000000000001','events/7a100000-0000-0000-0000-000000000001/'||id::text||'.jpg','single','clean-ivory','image/jpeg',120000,1080,1440 from generated;
set local role anon;
select throws_ok($$select * from public.create_media_upload_intent('media-active-a-test',repeat('a',64),'single','clean-ivory','image/jpeg',120000,1080,1440)$$,'22023','upload rate limit reached','Per-session upload rate limit is enforced');
reset role;

insert into public.media_assets(id,event_id,guest_session_id,storage_path,capture_mode,template_id,mime_type,byte_size,width,height,status,visibility,ready_at) values
('7a120000-0000-0000-0000-000000000001','7a100000-0000-0000-0000-000000000001','7a110000-0000-0000-0000-000000000001','events/7a100000-0000-0000-0000-000000000001/7a120000-0000-0000-0000-000000000001.jpg','single','clean-ivory','image/jpeg',120000,1080,1440,'ready','visible',now()),
('7a120000-0000-0000-0000-000000000002','7a100000-0000-0000-0000-000000000001','7a110000-0000-0000-0000-000000000001','events/7a100000-0000-0000-0000-000000000001/7a120000-0000-0000-0000-000000000002.jpg','single','clean-ivory','image/jpeg',120000,1080,1440,'ready','hidden',now()),
('7a120000-0000-0000-0000-000000000003','7a100000-0000-0000-0000-000000000001','7a110000-0000-0000-0000-000000000001','events/7a100000-0000-0000-0000-000000000001/7a120000-0000-0000-0000-000000000003.jpg','single','clean-ivory','image/jpeg',120000,1080,1440,'failed','visible',null),
('7a220000-0000-0000-0000-000000000001','7a200000-0000-0000-0000-000000000002','7a210000-0000-0000-0000-000000000002','events/7a200000-0000-0000-0000-000000000002/7a220000-0000-0000-0000-000000000001.jpg','single','clean-ivory','image/jpeg',120000,1080,1440,'ready','visible',now());

set local role anon;
select is((select count(*) from public.list_guest_gallery('media-active-a-test',repeat('a',64),null,null,30)),1::bigint,'Gallery returns only ready visible media');
select is((select valid from public.validate_guest_gallery_session('media-ended-a-test',repeat('b',64))),true,'Ended event gallery remains available to an existing session');
select is_empty($$select * from public.list_guest_gallery('media-active-b-test',repeat('a',64),null,null,30)$$,'Gallery token cannot cross events');
select is_empty($$select * from public.resolve_media_finalize('media-active-b-test',repeat('a',64),'7a120000-0000-0000-0000-000000000001')$$,'Guest cannot finalize another event media row');

set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-0000-0000-000000000001',true);
select results_eq($$select event_id from public.event_settings order by event_id$$,$$values('7a100000-0000-0000-0000-000000000001'::uuid),('7a200000-0000-0000-0000-000000000002'::uuid)$$,'Host sees settings only in own tenant');
select is_empty($$select id from public.media_assets where event_id='7b100000-0000-0000-0000-000000000001'$$,'Host cannot see cross-tenant media');
select lives_ok($$update public.event_settings set gallery_enabled=false where event_id='7a100000-0000-0000-0000-000000000001'$$,'Owner can manage event settings');
select set_config('request.jwt.claim.sub','73000000-0000-0000-0000-000000000003',true);
select is_empty($$update public.event_settings set gallery_enabled=true where event_id='7a100000-0000-0000-0000-000000000001' returning event_id$$,'Member cannot manage event settings');
select is_empty($$update public.media_assets set visibility='hidden' where id='7a120000-0000-0000-0000-000000000001' returning id$$,'Member cannot moderate media');

select * from finish();
rollback;
