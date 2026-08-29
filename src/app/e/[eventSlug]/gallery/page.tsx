import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicEvent } from '@/features/events/queries';
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getPublicEvent(eventSlug);
  if (!event || event.status !== 'active') notFound();
  return (
    <main className="min-h-svh bg-stone-950 p-5 text-white">
      <div className="mx-auto max-w-4xl py-8">
        <Link
          href={`/e/${eventSlug}`}
          className="inline-flex min-h-11 items-center text-sm text-stone-300"
        >
          ← Event
        </Link>
        <h1 className="display mt-8 text-4xl">Event gallery</h1>
        <div className="mt-8 rounded-xl border border-dashed border-white/20 p-12 text-center text-stone-400">
          Photos will appear here after capture and uploads are implemented.
        </div>
      </div>
    </main>
  );
}
