import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  removeMediaAction,
  setMediaVisibilityAction,
} from '@/features/media/actions';
import { listHostEventMedia } from '@/features/media/host-queries';
import { getOrganizationEvent } from '@/features/events/queries';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Event gallery' };
export default async function HostGalleryPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await getPrimaryOrganization(user.id);
  if (!organization) notFound();
  const event = await getOrganizationEvent(organization.id, eventId);
  if (!event) notFound();
  const items = await listHostEventMedia(eventId);
  const canManage = canManageOrganization(organization.role);
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/dashboard/events/${eventId}`}
        className="text-sm font-semibold underline underline-offset-4"
      >
        Back to event
      </Link>
      <p className="mt-8 text-sm font-semibold text-[var(--accent)]">
        {event.name}
      </p>
      <h1 className="display mt-1 text-4xl font-semibold">
        Gallery moderation
      </h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        Private originals are shown through short-lived signed links.
      </p>
      {items.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]"
            >
              <div
                className="relative bg-[var(--muted)]"
                style={{ aspectRatio: `${item.width} / ${item.height}` }}
              >
                {item.signedUrl ? (
                  <Image
                    src={item.signedUrl}
                    alt="Guest media preview"
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>{item.capture_mode}</span>
                  <span>·</span>
                  <span>{item.template_id}</span>
                  <span>·</span>
                  <span>{item.visibility}</span>
                </div>
                <p className="mt-2 text-sm">
                  {new Intl.DateTimeFormat('en', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(item.created_at))}
                </p>
                {canManage && item.status === 'ready' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form
                      action={setMediaVisibilityAction.bind(
                        null,
                        eventId,
                        item.id,
                        item.visibility === 'visible' ? 'hidden' : 'visible',
                      )}
                    >
                      <button className="min-h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold">
                        {item.visibility === 'visible' ? 'Hide' : 'Show'}
                      </button>
                    </form>
                    <form
                      action={removeMediaAction.bind(null, eventId, item.id)}
                    >
                      <button className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-800">
                        Remove
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-10 text-center text-[var(--muted-foreground)]">
          No saved event media yet.
        </div>
      )}
    </div>
  );
}
