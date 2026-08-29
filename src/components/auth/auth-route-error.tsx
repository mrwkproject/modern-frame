'use client';

export function AuthRouteError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-[var(--destructive)]">
          Account service unavailable
        </p>
        <h1 className="display mt-3 text-4xl font-semibold">
          We couldn’t connect securely.
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Check your connection and try again. No account changes were made.
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
