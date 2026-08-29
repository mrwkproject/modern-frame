import type { EventStatus, EventType } from '@/types/database';

export const EVENT_TYPES: ReadonlyArray<{
  value: EventType;
  label: string;
}> = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'conference', label: 'Conference' },
  { value: 'concert', label: 'Concert' },
  { value: 'community', label: 'Community' },
  { value: 'brand_activation', label: 'Brand activation' },
  { value: 'other', label: 'Other' },
];

export const EVENT_TYPE_VALUES = EVENT_TYPES.map((type) => type.value) as [
  EventType,
  ...EventType[],
];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  ended: 'Ended',
  archived: 'Archived',
};

export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPES.map((type) => [type.value, type.label]),
) as Record<EventType, string>;
