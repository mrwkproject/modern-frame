import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/wordmark';
import { getCurrentUser } from '@/features/organizations/queries';

export async function SiteHeader() {
  let authenticated = false;
  try {
    authenticated = Boolean(await getCurrentUser());
  } catch {
    // Keep the public landing page available during transient auth outages.
  }

  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Wordmark />
        <nav aria-label="Primary" className="flex items-center gap-2">
          <a
            href="#features"
            className="hidden min-h-11 items-center px-3 text-sm font-medium sm:flex"
          >
            Features
          </a>
          {authenticated ? (
            <ButtonLink href="/dashboard" tone="secondary">
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/register"
                className="hidden min-h-11 items-center px-3 text-sm font-semibold sm:flex"
              >
                Create account
              </Link>
              <ButtonLink href="/login" tone="secondary">
                Log in
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
