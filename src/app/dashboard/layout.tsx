import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { AccountMenu } from '@/components/account/account-menu';
import {
  getCurrentUser,
  getOwnProfile,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const organization = await getPrimaryOrganization(user.id);
  if (!organization) redirect('/onboarding');

  const profile = await getOwnProfile(user.id);
  const displayName =
    profile?.display_name ?? user.email?.split('@')[0] ?? 'Account';

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-5 lg:min-h-svh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Wordmark />
          <div className="lg:hidden">
            <AccountMenu
              displayName={displayName}
              email={user.email ?? 'Email unavailable'}
              organizationName={organization.name}
            />
          </div>
        </div>
        <nav
          aria-label="Host navigation"
          className="mt-8 flex gap-2 overflow-x-auto lg:flex-col"
        >
          <Link
            className="min-h-11 rounded-lg bg-[var(--muted)] px-4 py-3 text-sm font-semibold"
            href="/dashboard"
          >
            Overview
          </Link>
          <Link
            className="min-h-11 rounded-lg px-4 py-3 text-sm font-medium"
            href="/dashboard/events"
          >
            Events
          </Link>
        </nav>
      </aside>
      <div>
        <header className="hidden min-h-16 items-center justify-end border-b border-[var(--border)] px-8 lg:flex">
          <AccountMenu
            displayName={displayName}
            email={user.email ?? 'Email unavailable'}
            organizationName={organization.name}
          />
        </header>
        <main className="px-5 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
