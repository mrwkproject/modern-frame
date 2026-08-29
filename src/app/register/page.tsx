import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/brand/wordmark';
import { AuthForm } from '@/components/forms/auth-form';
import { registerAction } from '@/features/auth/actions';
import { decideHostDestination } from '@/features/auth/decisions';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';

export const metadata = { title: 'Create account' };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    let hasMembership = false;
    try {
      hasMembership = Boolean(await getPrimaryOrganization(user.id));
    } catch {
      redirect('/dashboard');
    }
    redirect(decideHostDestination({ authenticated: true, hasMembership }));
  }

  return (
    <main className="grid min-h-svh place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <Wordmark />
        <h1 className="display mt-10 text-4xl font-semibold">
          Create your account
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Start with a simple workspace. Your first event comes next.
        </p>
        <AuthForm action={registerAction} mode="register" />
      </section>
    </main>
  );
}
