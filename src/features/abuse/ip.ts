const MAX_IP_LENGTH = 64;

export function trustedClientIp(
  headers: Headers,
  development = process.env.NODE_ENV !== 'production',
) {
  if (development) return null;
  const value = headers.get('cf-connecting-ip')?.trim();
  if (!value || value.length > MAX_IP_LENGTH || !/^[0-9a-f:.]+$/i.test(value))
    return null;
  return value.toLowerCase();
}

export async function createRateLimitKey(input: {
  secret: string;
  scope: string;
  eventSlug: string;
  ip: string;
}) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(input.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${input.scope}\n${input.eventSlug}\n${input.ip}`),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
