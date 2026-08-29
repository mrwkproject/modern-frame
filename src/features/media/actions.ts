'use server';
import 'server-only';
import { revalidatePath } from 'next/cache';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';
import { EVENT_MEDIA_BUCKET } from '@/features/media/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { MediaVisibility } from '@/types/database';

async function requireMediaManager(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization || !canManageOrganization(organization.role)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organization_id', organization.id)
    .is('deleted_at', null)
    .maybeSingle();
  return data ? { supabase } : null;
}

export async function updateEventMediaSettingsAction(
  eventId: string,
  formData: FormData,
) {
  const context = await requireMediaManager(eventId);
  if (!context) return;
  await context.supabase
    .from('event_settings')
    .update({
      guest_uploads_enabled: formData.get('guestUploadsEnabled') === 'on',
      gallery_enabled: formData.get('galleryEnabled') === 'on',
    })
    .eq('event_id', eventId);
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/settings`);
}

export async function setMediaVisibilityAction(
  eventId: string,
  mediaId: string,
  visibility: MediaVisibility,
) {
  const context = await requireMediaManager(eventId);
  if (!context) return;
  await context.supabase.rpc('set_event_media_visibility', {
    requested_media_id: mediaId,
    requested_visibility: visibility,
  });
  revalidatePath(`/dashboard/events/${eventId}/gallery`);
}

export async function removeMediaAction(eventId: string, mediaId: string) {
  const context = await requireMediaManager(eventId);
  if (!context) return;
  const { data, error: archivedError } = await context.supabase.rpc(
    'archive_event_media',
    { requested_media_id: mediaId },
  );
  const media = data?.[0];
  if (archivedError || !media) return;
  const admin = createAdminClient();
  await admin.storage.from(EVENT_MEDIA_BUCKET).remove([media.storage_path]);
  revalidatePath(`/dashboard/events/${eventId}/gallery`);
}
