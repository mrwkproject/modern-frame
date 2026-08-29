import { NextRequest, NextResponse } from 'next/server';
import { EVENT_MEDIA_BUCKET } from '@/features/media/constants';
import { hasJpegMagic, isVerifiedJpegMetadata } from '@/features/media/helpers';
import { getGuestTokenHash } from '@/features/media/queries';
import { finalizeMediaSchema } from '@/features/media/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';
const privateJson = (body: object, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> },
) {
  const { eventSlug } = await params;
  const tokenHash = await getGuestTokenHash();
  if (!tokenHash) return privateJson({ error: 'Session required.' }, 401);
  const parsed = finalizeMediaSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return privateJson({ error: 'Invalid media reference.' }, 400);

  const publicClient = createPublicClient();
  const { data, error } = await publicClient.rpc('resolve_media_finalize', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
    requested_media_id: parsed.data.mediaId,
  });
  const media = data?.[0];
  if (error || !media)
    return privateJson({ error: 'Upload cannot be finalized.' }, 403);

  if (media.media_status === 'ready')
    return privateJson({ mediaId: media.media_id, status: 'ready' });

  const admin = createAdminClient();
  const { data: object, error: objectError } = await admin.storage
    .from(EVENT_MEDIA_BUCKET)
    .info(media.storage_path);
  const metadataValid =
    !objectError &&
    isVerifiedJpegMetadata({
      size: object.size,
      contentType: object.contentType,
      expectedSize: media.expected_byte_size,
    });
  const { data: storedBlob, error: downloadError } = metadataValid
    ? await admin.storage.from(EVENT_MEDIA_BUCKET).download(media.storage_path)
    : { data: null, error: objectError };
  const valid =
    metadataValid &&
    !downloadError &&
    storedBlob !== null &&
    (await hasJpegMagic(storedBlob));
  if (!valid) {
    await admin.storage.from(EVENT_MEDIA_BUCKET).remove([media.storage_path]);
    await admin
      .from('media_assets')
      .update({ status: 'failed' })
      .eq('id', media.media_id);
    return privateJson({ error: 'Uploaded photo failed verification.' }, 422);
  }

  const { error: updateError } = await admin
    .from('media_assets')
    .update({ status: 'ready', ready_at: new Date().toISOString() })
    .eq('id', media.media_id)
    .eq('status', 'pending');
  if (updateError)
    return privateJson({ error: 'Could not finish saving.' }, 503);
  return privateJson({ mediaId: media.media_id, status: 'ready' });
}
