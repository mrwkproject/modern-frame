import { Wordmark } from '@/components/brand/wordmark';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <Wordmark />
        <h1 className="display mt-10 text-4xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Authentication arrives in the next foundation phase.
        </p>
        <form className="mt-8 space-y-5">
          <label className="block text-sm font-semibold">
            Email address
            <input
              disabled
              type="email"
              className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-stone-100 px-4 text-stone-500"
              placeholder="you@example.com"
            />
          </label>
          <button
            disabled
            className="min-h-12 w-full rounded-lg bg-stone-400 font-semibold text-white"
          >
            Continue
          </button>
        </form>
        <p className="mt-5 text-sm text-[var(--muted-foreground)]">
          This is a UI placeholder; no credentials are collected.
        </p>
      </section>
    </main>
  );
}
