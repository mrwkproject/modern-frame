import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/brand/wordmark';
import { OrganizationForm } from '@/components/forms/organization-form';
import { signOutAction } from '@/features/auth/actions';
import { createOrganizationAction } from '@/features/organizations/actions';
import {
  getCurrentUser,
  getOwnProfile,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export const metadata = { title: 'Create workspace' };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const organization = await getPrimaryOrganization(user.id);
  if (organization) redirect('/dashboard');

  const profile = await getOwnProfile(user.id);
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10">
      <section className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <Wordmark />
        <p className="mt-10 text-sm font-bold tracking-[0.16em] text-[var(--accent)] uppercase">
          Welcome to Modern Frame
        </p>
        <h1 className="display mt-3 text-4xl font-semibold">
          Create your workspace
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          A workspace keeps every event, guest, and capture under one secure
          organization.
        </p>

        {profile ? (
          <OrganizationForm action={createOrganizationAction} />
        ) : (
          <div
            role="alert"
            className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            <p className="font-semibold">Your account needs attention.</p>
            <p className="mt-1">
              We could not find your profile. Sign out, then try registering
              again or contact support.
            </p>
          </div>
        )}

        <form action={signOutAction} className="mt-6 text-center">
          <button
            type="submit"
            className="min-h-11 px-4 text-sm font-semibold text-[var(--muted-foreground)] underline underline-offset-4"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
