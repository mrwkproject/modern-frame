'use client';

export default function OnboardingError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-[var(--destructive)]">
          Workspace unavailable
        </p>
        <h1 className="display mt-3 text-4xl font-semibold">
          We couldn’t load your account.
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Check your connection and try again. Your account data has not been
          changed.
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
