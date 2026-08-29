import Link from 'next/link';

export function CaptureHub({
  eventName,
  eventSlug,
}: {
  eventName: string;
  eventSlug: string;
}) {
  return (
    <main className="safe-bottom flex min-h-svh bg-stone-950 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[.14em] text-amber-300">
              MODERN FRAME
            </p>
            <p className="truncate text-sm text-stone-300">{eventName}</p>
          </div>
          <Link
            href={`/e/${eventSlug}`}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold"
          >
            Back to event
          </Link>
        </header>
        <section className="my-auto py-10">
          <p className="text-sm font-medium text-amber-300">Capture modes</p>
          <h1 className="display mt-2 text-4xl font-semibold">
            Capture a memory.
          </h1>
          <p className="mt-3 max-w-md text-stone-300">
            Choose one polished portrait, three automatic moments, or a short
            local video.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href={`/e/${eventSlug}/capture?mode=single`}
              className="group min-h-44 rounded-2xl border border-white/20 bg-white/5 p-6 transition-colors hover:bg-white/10"
            >
              <span className="text-sm font-semibold text-amber-300">
                Single Photo
              </span>
              <span className="display mt-3 block text-2xl font-semibold">
                One perfect frame
              </span>
              <span className="mt-3 block text-sm text-stone-300">
                Take one photo and finish it with a themed frame.
              </span>
            </Link>
            <Link
              href={`/e/${eventSlug}/capture?mode=booth3`}
              className="group min-h-44 rounded-2xl border border-amber-300/50 bg-amber-300/10 p-6 transition-colors hover:bg-amber-300/15"
            >
              <span className="text-sm font-semibold text-amber-300">
                3-Shot Photobooth
              </span>
              <span className="display mt-3 block text-2xl font-semibold">
                Three, two, one
              </span>
              <span className="mt-3 block text-sm text-stone-200">
                Three automatic shots in a classic booth experience.
              </span>
            </Link>
            <Link
              href={`/e/${eventSlug}/capture?mode=video`}
              className="group min-h-44 rounded-2xl border border-white/20 bg-white/5 p-6 transition-colors hover:bg-white/10 sm:col-span-2"
            >
              <span className="text-sm font-semibold text-amber-300">
                Video Booth
              </span>
              <span className="display mt-3 block text-2xl font-semibold">
                A short video memory
              </span>
              <span className="mt-3 block text-sm text-stone-300">
                Record eight seconds, preview it, and download it to this
                device. No microphone.
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
