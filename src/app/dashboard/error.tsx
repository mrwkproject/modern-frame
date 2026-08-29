'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-[70svh] place-items-center p-5 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-[var(--destructive)]">
          Dashboard unavailable
        </p>
        <h1 className="display mt-3 text-4xl font-semibold">
          We couldn’t load your workspace.
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Check your connection and try again. If this continues, your
          organization membership may need support.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 min-h-12 rounded-lg bg-[var(--primary)] px-5 font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
