import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getPublicEvent } from '@/features/events/queries';
import { GUEST_SESSION_COOKIE } from '@/features/guest-sessions/constants';
import { validateGuestSession } from '@/features/guest-sessions/queries';
import { hashGuestToken } from '@/features/guest-sessions/token';
import { GuestCamera } from '@/components/camera/guest-camera';
export default async function CapturePage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  if (!event || event.status !== 'active') notFound();
  const token = (await cookies()).get(GUEST_SESSION_COOKIE)?.value;
  if (!token) redirect(`/e/${eventSlug}/join?next=capture`);
  const session = await validateGuestSession(
    eventSlug,
    await hashGuestToken(token),
  );
  if (!session.valid) redirect(`/e/${eventSlug}/join?next=capture`);
  return <GuestCamera eventName={event.name} eventSlug={eventSlug} />;
}
