import 'server-only';
import {
  EVENT_MEDIA_BUCKET,
  SIGNED_GALLERY_URL_SECONDS,
} from '@/features/media/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function getEventMediaSettings(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_settings')
    .select('guest_uploads_enabled, gallery_enabled')
    .eq('event_id', eventId)
    .maybeSingle();
  if (error) throw new Error('EVENT_MEDIA_SETTINGS_FAILED');
  return data;
}

export async function listHostEventMedia(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('media_assets')
    .select(
      'id, storage_path, capture_mode, template_id, width, height, status, visibility, created_at',
    )
    .eq('event_id', eventId)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(0, 99);
  if (error) throw new Error('HOST_GALLERY_FAILED');
  const admin = createAdminClient();
  const { data: urls, error: urlError } = await admin.storage
    .from(EVENT_MEDIA_BUCKET)
    .createSignedUrls(
      data.map((item) => item.storage_path),
      SIGNED_GALLERY_URL_SECONDS,
    );
  if (urlError) throw new Error('HOST_GALLERY_SIGNING_FAILED');
  return data.map((item, index) => ({
    ...item,
    signedUrl: urls[index]?.signedUrl ?? null,
  }));
}
