import { NextRequest, NextResponse } from 'next/server';
import { EVENT_MEDIA_BUCKET } from '@/features/media/constants';
import { hasJpegMagic, isVerifiedJpegMetadata } from '@/features/media/helpers';
import { getGuestTokenHash } from '@/features/media/queries';
import { finalizeMediaSchema } from '@/features/media/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> },
) {
  const { eventSlug } = await params;
  const tokenHash = await getGuestTokenHash();
  if (!tokenHash)
    return NextResponse.json({ error: 'Session required.' }, { status: 401 });
  const parsed = finalizeMediaSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Invalid media reference.' },
      { status: 400 },
    );

  const publicClient = createPublicClient();
  const { data, error } = await publicClient.rpc('resolve_media_finalize', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
    requested_media_id: parsed.data.mediaId,
  });
  const media = data?.[0];
  if (error || !media)
    return NextResponse.json(
      { error: 'Upload cannot be finalized.' },
      { status: 403 },
    );

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
    return NextResponse.json(
      { error: 'Uploaded photo failed verification.' },
      { status: 422 },
    );
  }

  const { error: updateError } = await admin
    .from('media_assets')
    .update({ status: 'ready', ready_at: new Date().toISOString() })
    .eq('id', media.media_id)
    .eq('status', 'pending');
  if (updateError)
    return NextResponse.json(
      { error: 'Could not finish saving.' },
      { status: 503 },
    );
  return NextResponse.json({ mediaId: media.media_id, status: 'ready' });
}
