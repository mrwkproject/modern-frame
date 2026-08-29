import { MAX_MEDIA_BYTES } from '@/features/media/constants';

type GalleryCursor = { createdAt: string; id: string };

export function encodeGalleryCursor(cursor: GalleryCursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeGalleryCursor(
  value: string | null,
): GalleryCursor | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'createdAt' in parsed &&
      'id' in parsed &&
      typeof parsed.createdAt === 'string' &&
      !Number.isNaN(Date.parse(parsed.createdAt)) &&
      typeof parsed.id === 'string' &&
      /^[0-9a-f-]{36}$/i.test(parsed.id)
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    return null;
  }
  return null;
}

export function isVerifiedJpegMetadata(input: {
  size?: number;
  contentType?: string;
  expectedSize: number;
}) {
  return (
    typeof input.size === 'number' &&
    input.size > 0 &&
    input.size <= MAX_MEDIA_BYTES &&
    input.size === input.expectedSize &&
    input.contentType === 'image/jpeg'
  );
}

export async function hasJpegMagic(blob: Blob) {
  if (blob.size < 4) return false;
  const start = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  const end = new Uint8Array(await blob.slice(-2).arrayBuffer());
  return (
    start[0] === 0xff && start[1] === 0xd8 && end[0] === 0xff && end[1] === 0xd9
  );
}

export function mediaDownloadFilename(eventSlug: string, mode: string) {
  return `${eventSlug}-${mode === 'booth3' ? 'photo-strip' : 'framed-photo'}.jpg`;
}
