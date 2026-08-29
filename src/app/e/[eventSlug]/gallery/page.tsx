import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ShareGallery } from '@/components/media/share-gallery';
import { getPublicEvent } from '@/features/events/queries';
import { guestJoinUrl } from '@/features/guest-sessions/urls';
import {
  listGuestGallery,
  validateGuestGallerySession,
} from '@/features/media/queries';
import { getPublicEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { eventSlug } = await params;
  const { cursor } = await searchParams;
  const event = await getPublicEvent(eventSlug);
  if (!event || !['active', 'ended'].includes(event.status)) notFound();
  const validation = await validateGuestGallerySession(eventSlug);
  if (!validation) {
    if (event.status === 'active')
      redirect(`/e/${eventSlug}/join?next=gallery`);
    redirect(`/e/${eventSlug}`);
  }
  const gallery = await listGuestGallery(eventSlug, cursor ?? null);
  if (!gallery) redirect(`/e/${eventSlug}`);
  const shareUrl = `${guestJoinUrl(getPublicEnv().NEXT_PUBLIC_SITE_URL, eventSlug)}?next=gallery`;
  return (
    <main className="safe-bottom min-h-svh bg-stone-950 px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/e/${eventSlug}`}
            className="inline-flex min-h-11 items-center text-sm text-stone-300"
          >
            ← Event
          </Link>
          <ShareGallery url={shareUrl} eventName={event.name} />
        </header>
        <p className="mt-8 text-sm font-semibold text-amber-300">
          {event.name}
        </p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Event gallery</h1>
        <p className="mt-3 text-stone-400">
          Shared moments, saved privately for this event.
        </p>
        {gallery.items.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.items.map((item) =>
              item.signedUrl ? (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl bg-stone-900"
                >
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: `${item.width} / ${item.height}` }}
                  >
                    <Image
                      src={item.signedUrl}
                      alt={`Guest ${item.captureMode === 'booth3' ? 'photo strip' : 'framed photo'}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                </article>
              ) : null,
            )}
          </div>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-white/20 p-10 text-center">
            <h2 className="display text-2xl">No moments yet</h2>
            <p className="mt-2 text-sm text-stone-400">
              Saved framed photos will appear here.
            </p>
            {event.status === 'active' && validation.guest_uploads_enabled ? (
              <Link
                href={`/e/${eventSlug}/capture`}
                className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-bold text-stone-950"
              >
                Take a photo
              </Link>
            ) : null}
          </section>
        )}
        {gallery.nextCursor ? (
          <div className="mt-8 text-center">
            <Link
              href={`/e/${eventSlug}/gallery?cursor=${encodeURIComponent(gallery.nextCursor)}`}
              className="inline-flex min-h-12 items-center rounded-xl border border-white/25 px-6 font-semibold"
            >
              Older moments
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
