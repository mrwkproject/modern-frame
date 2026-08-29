import { signOutAction } from '@/features/auth/actions';

export function AccountMenu({
  displayName,
  email,
  organizationName,
}: {
  displayName: string;
  email: string;
  organizationName: string;
}) {
  return (
    <details className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold marker:content-none">
        {displayName}
      </summary>
      <div className="absolute top-full right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl shadow-stone-900/10">
        <p className="font-semibold break-words">{displayName}</p>
        <p className="mt-1 text-sm break-all text-[var(--muted-foreground)]">
          {email}
        </p>
        <div className="my-4 border-t border-[var(--border)]" />
        <p className="text-xs font-bold tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
          Workspace
        </p>
        <p className="mt-1 text-sm font-semibold break-words">
          {organizationName}
        </p>
        <form action={signOutAction} className="mt-4">
          <button
            type="submit"
            className="min-h-11 w-full rounded-lg border border-[var(--border)] px-4 text-left text-sm font-semibold hover:bg-[var(--muted)]"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
