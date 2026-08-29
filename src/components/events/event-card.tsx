import Link from 'next/link';
import { EVENT_TYPE_LABELS } from '@/features/events/constants';
import { formatEventDate } from '@/features/events/time';
import type { HostEvent } from '@/features/events/types';
import { StatusBadge } from '@/components/events/status-badge';

export function EventCard({ event }: { event: HostEvent }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--accent)]">
            {EVENT_TYPE_LABELS[event.eventType]}
          </p>
          <h2 className="display mt-1 text-2xl font-semibold break-words">
            {event.name}
          </h2>
        </div>
        <StatusBadge status={event.status} />
      </div>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        {formatEventDate(event.startsAt, event.timezone)} · {event.timezone}
      </p>
      <Link
        href={`/dashboard/events/${event.id}`}
        className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[var(--muted)]"
      >
        Manage event
      </Link>
    </article>
  );
}
