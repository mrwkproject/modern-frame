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
import { updateEventMediaSettingsAction } from '@/features/media/actions';
import { getEventMediaSettings } from '@/features/media/host-queries';

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
  const mediaSettings = await getEventMediaSettings(event.id);
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
      {mediaSettings ? (
        <section className="mt-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="display text-2xl font-semibold">Guest media</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Control new saves and whether authenticated guests can view the
            event gallery.
          </p>
          <form
            action={updateEventMediaSettingsAction.bind(null, event.id)}
            className="mt-5 grid gap-4"
          >
            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] p-4">
              <input
                type="checkbox"
                name="guestUploadsEnabled"
                defaultChecked={mediaSettings.guest_uploads_enabled}
                className="size-5 accent-[var(--accent)]"
              />
              <span>
                <span className="block font-semibold">Allow guest saves</span>
                <span className="block text-sm text-[var(--muted-foreground)]">
                  Guests can save completed framed photos to this event.
                </span>
              </span>
            </label>
            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] p-4">
              <input
                type="checkbox"
                name="galleryEnabled"
                defaultChecked={mediaSettings.gallery_enabled}
                className="size-5 accent-[var(--accent)]"
              />
              <span>
                <span className="block font-semibold">
                  Enable guest gallery
                </span>
                <span className="block text-sm text-[var(--muted-foreground)]">
                  Guests with a valid event session can see visible photos.
                </span>
              </span>
            </label>
            <button className="min-h-11 justify-self-start rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white">
              Save media settings
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
