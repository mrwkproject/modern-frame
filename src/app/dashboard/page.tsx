import { ButtonLink } from '@/components/ui/button';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--accent)]">
            Host workspace
          </p>
          <h1 className="display mt-1 text-4xl font-semibold">
            Good afternoon.
          </h1>
        </div>
        <ButtonLink href="/dashboard/events">Create event</ButtonLink>
      </div>
      <section
        className="mt-10 grid gap-4 sm:grid-cols-3"
        aria-label="Event summary"
      >
        {[
          ['Active events', '0'],
          ['Guest captures', '0'],
          ['Storage used', '0 MB'],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
            <p className="display mt-3 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-8 text-center sm:p-12">
        <h2 className="display text-2xl font-semibold">
          Your first event starts here
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[var(--muted-foreground)]">
          Event creation will be enabled after authentication and organization
          onboarding are connected.
        </p>
      </section>
    </div>
  );
}
