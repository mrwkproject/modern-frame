import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EventForm } from '@/components/events/event-form';
import { createEventAction } from '@/features/events/actions';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export const metadata = { title: 'Create event' };

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization || !canManageOrganization(organization.role)) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/events"
        className="text-sm font-semibold underline underline-offset-4"
      >
        Back to events
      </Link>
      <p className="mt-8 text-sm font-semibold text-[var(--accent)]">
        New event
      </p>
      <h1 className="display mt-1 text-4xl font-semibold">Create an event</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        It starts as a private draft. You can review the public page before
        activating it.
      </p>
      <EventForm action={createEventAction} mode="create" />
    </div>
  );
}
