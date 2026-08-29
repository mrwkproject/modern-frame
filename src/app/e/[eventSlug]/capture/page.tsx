import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getPublicEvent } from '@/features/events/queries';
import { GUEST_SESSION_COOKIE } from '@/features/guest-sessions/constants';
import { validateGuestSession } from '@/features/guest-sessions/queries';
import { hashGuestToken } from '@/features/guest-sessions/token';
import { GuestCamera } from '@/components/camera/guest-camera';
import { CaptureHub } from '@/components/camera/capture-hub';
import { ThreeShotBooth } from '@/components/camera/three-shot-booth';
import { resolveCaptureMode } from '@/features/camera/modes';
export default async function CapturePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ mode?: string | string[] }>;
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
  const mode = resolveCaptureMode((await searchParams).mode);
  if (mode === 'invalid') redirect(`/e/${eventSlug}/capture`);
  if (mode === 'single')
    return <GuestCamera eventName={event.name} eventSlug={eventSlug} />;
  if (mode === 'booth3')
    return <ThreeShotBooth eventName={event.name} eventSlug={eventSlug} />;
  return <CaptureHub eventName={event.name} eventSlug={eventSlug} />;
}
