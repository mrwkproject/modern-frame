import { ButtonLink } from '@/components/ui/button';
import { Wordmark } from '@/components/brand/wordmark';

export function SiteHeader() {
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
          <ButtonLink href="/login" tone="secondary">
            Log in
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
