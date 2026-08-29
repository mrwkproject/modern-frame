import { NextRequest, NextResponse } from 'next/server';
import { getGuestTokenHash } from '@/features/media/queries';
import { uploadIntentSchema } from '@/features/media/schema';
import { EVENT_MEDIA_BUCKET } from '@/features/media/constants';
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
  const parsed = uploadIntentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Invalid photo details.' },
      { status: 400 },
    );

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('create_media_upload_intent', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
    requested_capture_mode: parsed.data.captureMode,
    requested_template_id: parsed.data.templateId,
    requested_mime_type: parsed.data.mimeType,
    requested_byte_size: parsed.data.byteSize,
    requested_width: parsed.data.width,
    requested_height: parsed.data.height,
  });
  const intent = data?.[0];
  if (error || !intent)
    return NextResponse.json(
      { error: 'Photo saving is unavailable.' },
      { status: 403 },
    );

  const admin = createAdminClient();
  const { data: upload, error: uploadError } = await admin.storage
    .from(EVENT_MEDIA_BUCKET)
    .createSignedUploadUrl(intent.storage_path);
  if (uploadError) {
    await admin
      .from('media_assets')
      .update({ status: 'failed' })
      .eq('id', intent.media_id);
    return NextResponse.json(
      { error: 'Could not prepare the upload.' },
      { status: 503 },
    );
  }
  return NextResponse.json({
    mediaId: intent.media_id,
    upload: { path: upload.path, token: upload.token },
    expiresAt: intent.upload_expires_at,
  });
}
