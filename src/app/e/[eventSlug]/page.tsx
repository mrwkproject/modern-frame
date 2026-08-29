import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EVENT_TYPE_LABELS } from '@/features/events/constants';
import { getPublicEvent } from '@/features/events/queries';
import { formatEventDate } from '@/features/events/time';

type Props = { params: Promise<{ eventSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  if (!event)
    return {
      title: 'Event unavailable',
      robots: { index: false, follow: false },
    };
  return {
    title: `${event.name} — Modern Frame`,
    description: event.description ?? `You are invited to ${event.name}.`,
  };
}

export default async function GuestEventPage({ params }: Props) {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  if (!event) notFound();
  const isActive = event.status === 'active';
  const isEnded = event.status === 'ended';
  return (
    <main className="safe-bottom flex min-h-svh flex-col bg-stone-950 px-5 pt-6 text-white">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between text-xs font-bold tracking-[.16em] text-stone-400">
        <span>MODERN FRAME</span>
        <span>GUEST</span>
      </header>
      <section className="my-auto py-12 text-center">
        <p className="text-sm font-medium text-amber-300">
          {EVENT_TYPE_LABELS[event.eventType]} · You’re invited
        </p>
        <h1 className="display mx-auto mt-4 max-w-lg text-5xl leading-none font-semibold sm:text-6xl">
          {event.name}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-stone-300">
          {event.description ??
            'Take a photo, leave a memory, and see the day through everyone’s eyes.'}
        </p>
        <p className="mt-5 text-sm text-stone-400">
          {formatEventDate(event.startsAt, event.timezone)} · {event.timezone}
        </p>
        {isActive ? (
          <div className="mx-auto mt-10 grid max-w-sm gap-3">
            <Link
              href={`/e/${eventSlug}/capture`}
              className="flex min-h-14 items-center justify-center rounded-xl bg-white px-5 font-bold text-stone-950"
            >
              Open camera
            </Link>
            <Link
              href={`/e/${eventSlug}/gallery`}
              className="flex min-h-14 items-center justify-center rounded-xl border border-white/25 px-5 font-semibold"
            >
              View gallery
            </Link>
            <p className="mt-2 text-xs text-stone-500">
              Camera and gallery are prepared for later product phases.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-sm rounded-xl border border-white/15 bg-white/5 p-5">
            <h2 className="font-semibold">
              {isEnded ? 'This event has ended' : 'This event is not open yet'}
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              {isEnded
                ? 'Thank you for being part of the celebration.'
                : 'The host will open the guest experience when everything is ready.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
