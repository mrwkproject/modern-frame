import { describe, expect, it } from 'vitest';
import { createRateLimitKey, trustedClientIp } from '@/features/abuse/ip';
import { validateProductionSiteUrl } from '@/lib/env';

describe('release hardening helpers', () => {
  it('uses only Cloudflare connecting IP in production', () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.42',
      'x-forwarded-for': '198.51.100.10',
    });
    expect(trustedClientIp(headers, false)).toBe('203.0.113.42');
    expect(
      trustedClientIp(
        new Headers({ 'x-forwarded-for': '198.51.100.10' }),
        false,
      ),
    ).toBeNull();
    expect(trustedClientIp(headers, true)).toBeNull();
  });

  it('creates an opaque deterministic HMAC without retaining the raw IP', async () => {
    const input = {
      secret: 'a-release-secret-that-is-long-enough',
      scope: 'guest_join',
      eventSlug: 'summer-party',
      ip: '203.0.113.42',
    };
    const first = await createRateLimitKey(input);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain(input.ip);
    expect(await createRateLimitKey(input)).toBe(first);
    expect(
      await createRateLimitKey({ ...input, eventSlug: 'other-event' }),
    ).not.toBe(first);
  });

  it('requires a public HTTPS production site URL', () => {
    expect(validateProductionSiteUrl('https://photos.example.com/path')).toBe(
      'https://photos.example.com',
    );
    expect(() => validateProductionSiteUrl('http://localhost:3000')).toThrow(
      'PRODUCTION_SITE_URL_MUST_BE_PUBLIC_HTTPS',
    );
    expect(() => validateProductionSiteUrl('https://127.0.0.1')).toThrow(
      'PRODUCTION_SITE_URL_MUST_BE_PUBLIC_HTTPS',
    );
  });
});
