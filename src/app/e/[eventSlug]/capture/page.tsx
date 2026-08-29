import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getPublicEvent } from '@/features/events/queries';
import { GUEST_SESSION_COOKIE } from '@/features/guest-sessions/constants';
import { validateGuestSession } from '@/features/guest-sessions/queries';
import { hashGuestToken } from '@/features/guest-sessions/token';
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
  return (
    <main className="grid min-h-svh place-items-center bg-stone-950 p-5 text-center text-white">
      <div>
        <p className="text-sm text-amber-300">Camera coming next</p>
        <h1 className="display mt-3 text-4xl">Ready when you are.</h1>
        <p className="mt-3 text-stone-400">
          No camera permission is requested in this foundation.
        </p>
        <Link
          href={`/e/${eventSlug}`}
          className="mt-8 inline-flex min-h-12 items-center rounded-xl border border-white/25 px-5 font-semibold"
        >
          Back to event
        </Link>
      </div>
    </main>
  );
}
