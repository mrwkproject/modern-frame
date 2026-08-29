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
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  const event = await getPublicEvent(eventSlug);
  if (!event || event.status !== 'active') {
    return NextResponse.redirect(new URL(eventPath, request.url));
  }

  const existingToken = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  if (existingToken) {
    const validation = await validateGuestSession(
      eventSlug,
      await hashGuestToken(existingToken),
    );
    if (validation.valid) return NextResponse.redirect(redirectTo);
  }

  const rawToken = generateGuestToken();
  const session = await createGuestSession(
    eventSlug,
    await hashGuestToken(rawToken),
  );
  if (!session) return NextResponse.redirect(new URL(eventPath, request.url));

  const response = NextResponse.redirect(redirectTo);
  const options = guestCookieOptions(eventSlug, new Date(session.expires_at));
  response.cookies.set(options.name, rawToken, options);
  return response;
}
