import { GUEST_SESSION_COOKIE } from '@/features/guest-sessions/constants';

export function guestCookieOptions(
  eventSlug: string,
  expires: Date,
  secure = process.env.NODE_ENV === 'production',
) {
  return {
    name: GUEST_SESSION_COOKIE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: `/e/${eventSlug}`,
    expires,
  };
}
