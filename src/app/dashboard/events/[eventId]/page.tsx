import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/events/status-badge';
import { CopyGuestLink } from '@/components/events/copy-guest-link';
import {
  activateEventAction,
  archiveEventAction,
  endEventAction,
} from '@/features/events/actions';
import { EVENT_TYPE_LABELS } from '@/features/events/constants';
import { getOrganizationEvent } from '@/features/events/queries';
import { formatEventDate } from '@/features/events/time';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';
import { getPublicEnv } from '@/lib/env';
import { guestJoinUrl } from '@/features/guest-sessions/urls';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization) return null;
  const event = await getOrganizationEvent(organization.id, eventId);
  if (!event) notFound();
  const canManage = canManageOrganization(organization.role);
  const publicUrl = `${getPublicEnv().NEXT_PUBLIC_SITE_URL}/e/${event.slug}`;
  const joinUrl = guestJoinUrl(getPublicEnv().NEXT_PUBLIC_SITE_URL, event.slug);
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/events"
        className="text-sm font-semibold underline underline-offset-4"
      >
        Back to events
      </Link>
      <div className="mt-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[var(--accent)]">
              {EVENT_TYPE_LABELS[event.eventType]}
            </p>
            <StatusBadge status={event.status} />
          </div>
          <h1 className="display mt-2 text-4xl font-semibold sm:text-5xl">
            {event.name}
          </h1>
          <p className="mt-3 text-[var(--muted-foreground)]">
            {formatEventDate(event.startsAt, event.timezone)} · {event.timezone}
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/events/${event.id}/gallery`}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white"
            >
              Gallery
            </Link>
            <Link
              href={`/dashboard/events/${event.id}/settings`}
              className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-semibold"
            >
              Event settings
            </Link>
          </div>
        ) : null}
      </div>
      <section className="mt-8 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="display text-2xl font-semibold">Public event page</h2>
        <p className="mt-2 text-sm break-all text-[var(--muted-foreground)]">
          {publicUrl}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white"
          >
            Preview public page
          </a>
          {canManage && event.status === 'draft' ? (
            <form action={activateEventAction.bind(null, event.id)}>
              <button className="min-h-11 rounded-lg border border-[var(--border)] px-5 text-sm font-semibold">
                Activate event
              </button>
            </form>
          ) : null}
          {canManage && event.status === 'active' ? (
            <form action={endEventAction.bind(null, event.id)}>
              <button className="min-h-11 rounded-lg border border-[var(--border)] px-5 text-sm font-semibold">
                End event
              </button>
            </form>
          ) : null}
          {canManage &&
          (event.status === 'draft' || event.status === 'ended') ? (
            <form action={archiveEventAction.bind(null, event.id)}>
              <button className="min-h-11 rounded-lg border border-red-200 px-5 text-sm font-semibold text-red-800">
                Archive event
              </button>
            </form>
          ) : null}
        </div>
        {event.status === 'draft' ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Guests can preview event details, but capture and gallery links stay
            unavailable until activation.
          </p>
        ) : null}
      </section>
      <section className="mt-8 grid gap-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 md:grid-cols-[16rem_1fr] md:items-center">
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated SVG route has no intrinsic Next Image benefit */}
          <img
            src={`/dashboard/events/${event.id}/qr`}
            width="512"
            height="512"
            alt={`Guest join QR code for ${event.name}`}
            className="h-auto w-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--accent)]">
            Guest access
          </p>
          <h2 className="display mt-1 text-2xl font-semibold">Guest QR</h2>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Scan to join this event. The QR contains only the public join URL
            and no session secret.
          </p>
          <p className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm [overflow-wrap:anywhere]">
            {joinUrl}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <CopyGuestLink url={joinUrl} />
            <a
              href={`/dashboard/events/${event.id}/qr?download=1`}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white"
            >
              Download SVG
            </a>
          </div>
        </div>
      </section>
      <section
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Upcoming event modules"
      >
        {[
          ['Guest access', 'QR and secure guest sessions enabled'],
          ['Camera', 'Single and 3-shot capture enabled'],
          ['Photo frames', 'Three system frames available'],
          ['Gallery', 'Private gallery and moderation enabled'],
        ].map(([title, detail]) => (
          <article
            key={title}
            className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-5"
          >
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {detail}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
