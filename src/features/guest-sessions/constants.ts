export const GUEST_SESSION_COOKIE = 'mf_guest_session';
export const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type GuestDestination = 'event' | 'capture' | 'gallery';

export function guestDestination(value: string | null): GuestDestination {
  return value === 'capture' || value === 'gallery' ? value : 'event';
}

export function guestDestinationPath(
  slug: string,
  destination: GuestDestination,
) {
  if (destination === 'capture') return `/e/${slug}/capture`;
  if (destination === 'gallery') return `/e/${slug}/gallery`;
  return `/e/${slug}`;
}
