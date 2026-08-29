import { NextRequest, NextResponse } from 'next/server';
import {
  GUEST_SESSION_COOKIE,
  EVENT_SLUG_PATTERN,
  guestDestination,
  guestDestinationPath,
} from '@/features/guest-sessions/constants';
import { guestCookieOptions } from '@/features/guest-sessions/cookie';
import {
  createGuestSession,
  validateGuestSession,
} from '@/features/guest-sessions/queries';
import {
  generateGuestToken,
  hashGuestToken,
} from '@/features/guest-sessions/token';
import { getPublicEvent } from '@/features/events/queries';
import { trustedClientIp } from '@/features/abuse/ip';
import { consumeJoinRateLimit } from '@/features/abuse/rate-limit';

export const dynamic = 'force-dynamic';
const privateRedirect = (url: URL) => {
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventSlug: string }> },
) {
  const { eventSlug } = await params;
  const destination = guestDestination(
    request.nextUrl.searchParams.get('next'),
  );
  const eventPath = `/e/${eventSlug}`;
  const redirectTo = new URL(
    guestDestinationPath(eventSlug, destination),
    request.url,
  );

  if (!EVENT_SLUG_PATTERN.test(eventSlug)) {
    return privateRedirect(new URL('/not-found', request.url));
  }

  const event = await getPublicEvent(eventSlug);
  if (!event || event.status !== 'active') {
    return privateRedirect(new URL(eventPath, request.url));
  }

  const existingToken = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  if (existingToken) {
    const validation = await validateGuestSession(
      eventSlug,
      await hashGuestToken(existingToken),
    );
    if (validation.valid) return privateRedirect(redirectTo);
  }

  const clientIp = trustedClientIp(request.headers);
  if (clientIp) {
    const limit = await consumeJoinRateLimit(eventSlug, clientIp).catch(
      () => null,
    );
    if (!limit) {
      return new NextResponse(
        'Guest joining is temporarily unavailable. Please try again shortly.',
        {
          status: 503,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        },
      );
    }
    if (!limit.allowed) {
      return new NextResponse(
        'Too many join attempts. Please wait a few minutes and try again.',
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Content-Type': 'text/plain; charset=utf-8',
            'Retry-After': String(limit.retry_after_seconds),
          },
        },
      );
    }
  }

  const rawToken = generateGuestToken();
  const session = await createGuestSession(
    eventSlug,
    await hashGuestToken(rawToken),
  );
  if (!session) return privateRedirect(new URL(eventPath, request.url));

  const response = NextResponse.redirect(redirectTo);
  const options = guestCookieOptions(eventSlug, new Date(session.expires_at));
  response.cookies.set(options.name, rawToken, options);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}
