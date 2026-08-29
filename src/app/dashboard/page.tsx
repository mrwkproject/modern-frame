import Link from 'next/link';
import { EventCard } from '@/components/events/event-card';
import { listOrganizationEvents } from '@/features/events/queries';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization) return null;
  const events = await listOrganizationEvents(organization.id);
  const canManage = canManageOrganization(organization.role);
  const activeCount = events.filter(
    (event) => event.status === 'active',
  ).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            Host workspace
          </p>
          <h1 className="display mt-1 text-4xl font-semibold">
            Good afternoon.
          </h1>
        </div>
        {canManage ? (
          <Link
            href="/dashboard/events/new"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Create event
          </Link>
        ) : null}
      </div>
      <section
        className="mt-10 grid gap-4 sm:grid-cols-3"
        aria-label="Event summary"
      >
        {[
          ['Active events', String(activeCount)],
          ['Guest captures', '0'],
          ['Storage used', '0 MB'],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
            <p className="display mt-3 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      {events.length ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="display text-2xl font-semibold">Recent events</h2>
            <Link
              href="/dashboard/events"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {events.slice(0, 2).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-8 text-center sm:p-12">
          <h2 className="display text-2xl font-semibold">
            Your first event starts here
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--muted-foreground)]">
            Create an event, configure its schedule, then activate its guest
            page when you are ready.
          </p>
        </section>
      )}
    </div>
  );
}
