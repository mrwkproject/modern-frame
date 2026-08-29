import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import {
  guestDestination,
  guestDestinationPath,
} from '@/features/guest-sessions/constants';
import { guestCookieOptions } from '@/features/guest-sessions/cookie';
import { generateGuestQrSvg } from '@/features/guest-sessions/qr';
import {
  generateGuestToken,
  hashGuestToken,
} from '@/features/guest-sessions/token';
import {
  guestJoinUrl,
  qrDownloadFilename,
} from '@/features/guest-sessions/urls';

describe('guest routing', () => {
  it('allows only the event and capture destinations', () => {
    expect(guestDestination('capture')).toBe('capture');
    expect(guestDestination('event')).toBe('event');
    expect(guestDestination('https://evil.example')).toBe('event');
    expect(guestDestination('//evil.example')).toBe('event');
    expect(guestDestinationPath('summer-party', 'capture')).toBe(
      '/e/summer-party/capture',
    );
  });

  it('builds an absolute public join URL without identifiers or secrets', () => {
    expect(guestJoinUrl('https://modern-frame.example', 'summer-party')).toBe(
      'https://modern-frame.example/e/summer-party/join',
    );
  });
});

describe('guest token and cookie', () => {
  it('generates a 256-bit base64url token and a SHA-256 hash', async () => {
    const first = generateGuestToken();
    const second = generateGuestToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
    expect(await hashGuestToken(first)).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashGuestToken(first)).not.toBe(first);
  });

  it('uses a narrowly scoped HttpOnly cookie', () => {
    const expires = new Date('2026-09-07T00:00:00.000Z');
    expect(guestCookieOptions('summer-party', expires, true)).toEqual({
      name: 'mf_guest_session',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/e/summer-party',
      expires,
    });
  });
});

describe('guest QR', () => {
  it('encodes the expected join URL and produces a non-empty SVG', async () => {
    const joinUrl = 'https://modern-frame.example/e/summer-party/join';
    const encoded = QRCode.create(joinUrl).segments[0]?.data;
    expect(new TextDecoder().decode(encoded as Uint8Array)).toBe(joinUrl);
    const svg = await generateGuestQrSvg(joinUrl);
    expect(svg).toMatch(/^<svg/);
    expect(svg.length).toBeGreaterThan(500);
  });

  it('sanitizes download filenames', () => {
    expect(qrDownloadFilename('../../Summer Party!')).toBe(
      'summer-party-modern-frame-qr.svg',
    );
  });
});
