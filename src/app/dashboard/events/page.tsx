import Link from 'next/link';
import { EventCard } from '@/components/events/event-card';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';
import { listOrganizationEvents } from '@/features/events/queries';

export const metadata = { title: 'Events' };

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization) return null;
  const events = await listOrganizationEvents(organization.id);
  const canManage = canManageOrganization(organization.role);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            Host workspace
          </p>
          <h1 className="display mt-1 text-4xl font-semibold">Events</h1>
        </div>
        {canManage ? (
          <Link
            href="/dashboard/events/new"
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white"
          >
            Create event
          </Link>
        ) : null}
      </div>
      {events.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <section className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="display text-2xl font-semibold">No events yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--muted-foreground)]">
            Create your first event to prepare its guest experience and public
            link.
          </p>
          {canManage ? (
            <Link
              href="/dashboard/events/new"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-semibold"
            >
              Create your first event
            </Link>
          ) : null}
        </section>
      )}
    </div>
  );
}
