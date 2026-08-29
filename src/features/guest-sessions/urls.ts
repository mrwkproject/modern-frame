import { EVENT_SLUG_PATTERN } from '@/features/guest-sessions/constants';

export function guestJoinUrl(siteUrl: string, eventSlug: string) {
  if (!EVENT_SLUG_PATTERN.test(eventSlug))
    throw new Error('INVALID_EVENT_SLUG');
  return new URL(`/e/${eventSlug}/join`, siteUrl).toString();
}

export function qrDownloadFilename(eventSlug: string) {
  const safeSlug = eventSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${safeSlug || 'event'}-modern-frame-qr.svg`;
}
