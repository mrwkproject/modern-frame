import { Wordmark } from '@/components/brand/wordmark';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-5 lg:min-h-svh lg:border-r lg:border-b-0">
        <Wordmark />
        <nav
          aria-label="Host navigation"
          className="mt-8 flex gap-2 overflow-x-auto lg:flex-col"
        >
          <a
            className="min-h-11 rounded-lg bg-[var(--muted)] px-4 py-3 text-sm font-semibold"
            href="/dashboard"
          >
            Overview
          </a>
          <a
            className="min-h-11 rounded-lg px-4 py-3 text-sm font-medium"
            href="/dashboard/events"
          >
            Events
          </a>
        </nav>
      </aside>
      <main className="px-5 py-8 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
