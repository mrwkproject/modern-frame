import 'server-only';

import { cookies } from 'next/headers';
import { GUEST_SESSION_COOKIE } from '@/features/guest-sessions/constants';
import { hashGuestToken } from '@/features/guest-sessions/token';
import {
  EVENT_MEDIA_BUCKET,
  GALLERY_PAGE_SIZE,
  SIGNED_GALLERY_URL_SECONDS,
} from '@/features/media/constants';
import {
  decodeGalleryCursor,
  encodeGalleryCursor,
} from '@/features/media/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';

export async function getGuestTokenHash() {
  const rawToken = (await cookies()).get(GUEST_SESSION_COOKIE)?.value;
  return rawToken ? hashGuestToken(rawToken) : null;
}

export async function listGuestGallery(
  eventSlug: string,
  cursorValue: string | null,
) {
  const tokenHash = await getGuestTokenHash();
  if (!tokenHash) return null;
  const cursor = decodeGalleryCursor(cursorValue);
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('list_guest_gallery', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
    cursor_created_at: cursor?.createdAt ?? null,
    cursor_id: cursor?.id ?? null,
    page_size: GALLERY_PAGE_SIZE + 1,
  });
  if (error) throw new Error('GALLERY_LOOKUP_FAILED');
  const hasMore = data.length > GALLERY_PAGE_SIZE;
  const page = data.slice(0, GALLERY_PAGE_SIZE);
  const admin = createAdminClient();
  const { data: signed, error: signedError } = await admin.storage
    .from(EVENT_MEDIA_BUCKET)
    .createSignedUrls(
      page.map((item) => item.storage_path),
      SIGNED_GALLERY_URL_SECONDS,
    );
  if (signedError) throw new Error('GALLERY_SIGNING_FAILED');
  const items = page.map((item, index) => ({
    id: item.id,
    captureMode: item.capture_mode,
    templateId: item.template_id,
    width: item.width,
    height: item.height,
    createdAt: item.created_at,
    signedUrl: signed[index]?.signedUrl ?? null,
  }));
  const last = page.at(-1);
  return {
    items,
    nextCursor:
      hasMore && last
        ? encodeGalleryCursor({ createdAt: last.created_at, id: last.id })
        : null,
  };
}

export async function validateGuestGallerySession(eventSlug: string) {
  const tokenHash = await getGuestTokenHash();
  if (!tokenHash) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('validate_guest_gallery_session', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
  });
  if (error) throw new Error('GALLERY_SESSION_VALIDATION_FAILED');
  return data[0] ?? null;
}
