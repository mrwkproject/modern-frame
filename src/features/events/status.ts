import type { EventStatus } from '@/types/database';

const ALLOWED_TRANSITIONS: Record<EventStatus, ReadonlyArray<EventStatus>> = {
  draft: ['active', 'archived'],
  active: ['ended'],
  ended: ['archived'],
  archived: [],
};

export function canTransitionEvent(current: EventStatus, next: EventStatus) {
  return ALLOWED_TRANSITIONS[current].includes(next);
}
