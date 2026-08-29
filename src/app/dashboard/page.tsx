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
        <span
          aria-disabled="true"
          className="inline-flex min-h-11 cursor-not-allowed items-center rounded-[var(--radius-sm)] bg-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600"
          title="Event creation arrives in Prompt 02"
        >
          Create event soon
        </span>
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
          Your workspace is ready. Event creation arrives in the next product
          phase.
        </p>
      </section>
    </div>
  );
}
