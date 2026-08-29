import Link from 'next/link';

export function Wordmark() {
  return (
    <Link
      href="/"
      className="display rounded-sm text-xl font-bold"
      aria-label="Modern Frame home"
    >
      Modern Frame<span className="text-[var(--accent)]">.</span>
    </Link>
  );
}
