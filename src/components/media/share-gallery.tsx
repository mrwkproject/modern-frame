'use client';
import { useState } from 'react';
export function ShareGallery({
  url,
  eventName,
}: {
  url: string;
  eventName: string;
}) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share)
      return void (await navigator
        .share({ title: `${eventName} gallery`, url })
        .catch(() => undefined));
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };
  return (
    <button
      type="button"
      onClick={() => void share()}
      className="min-h-11 rounded-xl border border-white/25 px-4 text-sm font-semibold"
    >
      {copied ? 'Link copied' : 'Share gallery'}
    </button>
  );
}
