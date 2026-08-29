export const GUEST_SESSION_COOKIE = 'mf_guest_session';
export const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type GuestDestination = 'event' | 'capture';

export function guestDestination(value: string | null): GuestDestination {
  return value === 'capture' ? 'capture' : 'event';
}

export function guestDestinationPath(
  slug: string,
  destination: GuestDestination,
) {
  return destination === 'capture' ? `/e/${slug}/capture` : `/e/${slug}`;
}
