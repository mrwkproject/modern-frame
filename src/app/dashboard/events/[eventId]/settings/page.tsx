import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EventForm } from '@/components/events/event-form';
import { updateEventAction } from '@/features/events/actions';
import { getOrganizationEvent } from '@/features/events/queries';
import { isoToEventInputs } from '@/features/events/time';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export const metadata = { title: 'Event settings' };
export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization || !canManageOrganization(organization.role)) notFound();
  const event = await getOrganizationEvent(organization.id, eventId);
  if (!event || !event.startsAt || !event.endsAt) notFound();
  const start = isoToEventInputs(event.startsAt, event.timezone);
  const end = isoToEventInputs(event.endsAt, event.timezone);
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/events/${event.id}`}
        className="text-sm font-semibold underline underline-offset-4"
      >
        Back to event
      </Link>
      <p className="mt-8 text-sm font-semibold text-[var(--accent)]">
        Event settings
      </p>
      <h1 className="display mt-1 text-4xl font-semibold">Edit {event.name}</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        The public slug and workspace ownership remain fixed for stable, secure
        guest links.
      </p>
      <EventForm
        action={updateEventAction.bind(null, event.id)}
        mode="edit"
        defaults={{
          name: event.name,
          eventType: event.eventType,
          date: start.date,
          startTime: start.time,
          endTime: end.time,
          timezone: event.timezone,
          description: event.description ?? '',
        }}
      />
    </div>
  );
}
