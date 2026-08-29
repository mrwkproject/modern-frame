export const metadata = { title: 'Events' };
export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-[var(--accent)]">
        Host workspace
      </p>
      <h1 className="display mt-1 text-4xl font-semibold">Events</h1>
      <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--muted-foreground)]">
        Event management arrives after organization onboarding.
      </div>
    </div>
  );
}
