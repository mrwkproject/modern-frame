import Link from 'next/link';

export const metadata = { title: 'Guest event' };

export default async function GuestEventPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  return (
    <main className="safe-bottom flex min-h-svh flex-col bg-stone-950 px-5 pt-6 text-white">
      <header className="flex items-center justify-between text-xs font-bold tracking-[.16em] text-stone-400">
        <span>MODERN FRAME</span>
        <span>GUEST</span>
      </header>
      <section className="my-auto py-12 text-center">
        <p className="text-sm font-medium text-amber-300">You’re invited</p>
        <h1 className="display mx-auto mt-4 max-w-sm text-5xl leading-none font-semibold">
          A celebration worth remembering.
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-stone-300">
          Take a photo, leave a memory, and see the day through everyone’s eyes.
        </p>
        <div className="mx-auto mt-10 grid max-w-sm gap-3">
          <Link
            href={`/e/${eventSlug}/capture`}
            className="flex min-h-14 items-center justify-center rounded-xl bg-white px-5 font-bold text-stone-950"
          >
            Open camera
          </Link>
          <Link
            href={`/e/${eventSlug}/gallery`}
            className="flex min-h-14 items-center justify-center rounded-xl border border-white/25 px-5 font-semibold"
          >
            View gallery
          </Link>
        </div>
        <p className="mt-6 text-xs text-stone-500">
          Camera and gallery are placeholders in this phase.
        </p>
      </section>
    </main>
  );
}
