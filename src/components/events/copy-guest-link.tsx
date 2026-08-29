'use client';

import { useEffect, useState } from 'react';

export function CopyGuestLink({ url }: { url: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="min-h-11 rounded-lg border border-[var(--border)] px-5 text-sm font-semibold"
      aria-live="polite"
    >
      {status === 'copied'
        ? 'Link copied'
        : status === 'error'
          ? 'Copy failed—try again'
          : 'Copy guest link'}
    </button>
  );
}
