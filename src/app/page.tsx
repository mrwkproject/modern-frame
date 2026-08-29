import { ButtonLink } from '@/components/ui/button';
import { SiteHeader } from '@/components/layout/site-header';

const modes = ['Guest camera', 'Photo booth', 'Event gallery'];

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div>
          <p className="mb-5 text-sm font-bold tracking-[0.2em] text-[var(--accent)] uppercase">
            Every angle. One event.
          </p>
          <h1 className="display max-w-3xl text-5xl leading-[.98] font-semibold sm:text-6xl lg:text-7xl">
            Let every guest help tell the story.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--muted-foreground)]">
            A camera-first event platform for candid moments, polished photo
            booth captures, and one gallery everyone can enjoy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/login">Create your event</ButtonLink>
            <ButtonLink href="/e/demo-celebration" tone="secondary">
              View guest experience
            </ButtonLink>
          </div>
        </div>
        <div
          className="relative mx-auto w-full max-w-lg"
          aria-label="Product preview"
        >
          <div className="aspect-[4/5] rounded-[2rem] bg-stone-900 p-5 text-white shadow-2xl shadow-stone-900/15">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>THE WILLOW ROOM</span>
              <span>24 AUG</span>
            </div>
            <div className="flex h-full flex-col justify-end pb-6">
              <p className="display text-4xl">Maya &amp; Arif</p>
              <p className="mt-2 text-sm text-stone-300">
                Capture the moments between the moments.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {modes.map((mode) => (
                  <div
                    key={mode}
                    className="rounded-xl border border-white/20 bg-white/10 p-3 text-center text-xs"
                  >
                    {mode}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="border-y border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-3">
          {[
            ['Camera first', 'Guests open, capture, and continue celebrating.'],
            [
              'Made for every event',
              'A neutral foundation that adapts from weddings to brand activations.',
            ],
            [
              'Private by design',
              'Tenant isolation and private media are foundational, not add-ons.',
            ],
          ].map(([title, body], index) => (
            <article key={title}>
              <p className="text-xs font-bold text-[var(--accent)]">
                0{index + 1}
              </p>
              <h2 className="display mt-3 text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-[var(--muted-foreground)]">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
