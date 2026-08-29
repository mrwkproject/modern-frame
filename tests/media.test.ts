import { describe, expect, it } from 'vitest';
import {
  guestDestination,
  guestDestinationPath,
} from '@/features/guest-sessions/constants';
import {
  decodeGalleryCursor,
  encodeGalleryCursor,
  hasJpegMagic,
  isVerifiedJpegMetadata,
  mediaDownloadFilename,
} from '@/features/media/helpers';
import { uploadIntentSchema } from '@/features/media/schema';

describe('private event media helpers', () => {
  const valid = {
    byteSize: 120_000,
    width: 1080,
    height: 1440,
    captureMode: 'single',
    templateId: 'clean-ivory',
    mimeType: 'image/jpeg',
  } as const;
  it('accepts a valid framed JPEG upload payload', () =>
    expect(uploadIntentSchema.safeParse(valid).success).toBe(true));
  it('rejects oversized and non-JPEG payloads', () => {
    expect(
      uploadIntentSchema.safeParse({ ...valid, byteSize: 8 * 1024 * 1024 + 1 })
        .success,
    ).toBe(false);
    expect(
      uploadIntentSchema.safeParse({ ...valid, mimeType: 'image/png' }).success,
    ).toBe(false);
  });
  it('enforces capture-mode template pairing', () =>
    expect(
      uploadIntentSchema.safeParse({
        ...valid,
        captureMode: 'booth3',
        templateId: 'clean-ivory',
      }).success,
    ).toBe(false));
  it('round trips stable gallery cursors and rejects malformed input', () => {
    const cursor = {
      createdAt: '2026-08-30T12:00:00.000Z',
      id: '11111111-1111-4111-8111-111111111111',
    };
    expect(decodeGalleryCursor(encodeGalleryCursor(cursor))).toEqual(cursor);
    expect(decodeGalleryCursor('not-a-cursor')).toBeNull();
  });
  it('supports the allowlisted gallery join destination', () => {
    expect(guestDestination('gallery')).toBe('gallery');
    expect(guestDestinationPath('summer-party', 'gallery')).toBe(
      '/e/summer-party/gallery',
    );
    expect(guestDestination('https://evil.test')).toBe('event');
  });
  it('requires exact, bounded JPEG object metadata', () => {
    expect(
      isVerifiedJpegMetadata({
        size: 120,
        expectedSize: 120,
        contentType: 'image/jpeg',
      }),
    ).toBe(true);
    expect(
      isVerifiedJpegMetadata({
        size: 119,
        expectedSize: 120,
        contentType: 'image/jpeg',
      }),
    ).toBe(false);
  });
  it('checks JPEG start and end markers', async () => {
    expect(
      await hasJpegMagic(
        new Blob([new Uint8Array([0xff, 0xd8, 1, 0xff, 0xd9])]),
      ),
    ).toBe(true);
    expect(
      await hasJpegMagic(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])])),
    ).toBe(false);
  });
  it('creates safe media download filenames', () => {
    expect(mediaDownloadFilename('summer-party', 'single')).toBe(
      'summer-party-framed-photo.jpg',
    );
    expect(mediaDownloadFilename('summer-party', 'booth3')).toBe(
      'summer-party-photo-strip.jpg',
    );
  });
});
