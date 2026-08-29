import Link from 'next/link';
export default async function CapturePage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  return (
    <main className="grid min-h-svh place-items-center bg-stone-950 p-5 text-center text-white">
      <div>
        <p className="text-sm text-amber-300">Camera coming next</p>
        <h1 className="display mt-3 text-4xl">Ready when you are.</h1>
        <p className="mt-3 text-stone-400">
          No camera permission is requested in this foundation.
        </p>
        <Link
          href={`/e/${eventSlug}`}
          className="mt-8 inline-flex min-h-12 items-center rounded-xl border border-white/25 px-5 font-semibold"
        >
          Back to event
        </Link>
      </div>
    </main>
  );
}
