import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type ButtonLinkProps = ComponentProps<typeof Link> & {
  tone?: 'primary' | 'secondary';
};

export function ButtonLink({
  className,
  tone = 'primary',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-5 py-2.5 text-sm font-semibold transition-colors',
        tone === 'primary'
          ? 'bg-[var(--primary)] text-white hover:bg-stone-700'
          : 'border border-[var(--border)] bg-[var(--surface)] hover:bg-white',
        className,
      )}
      {...props}
    />
  );
}
