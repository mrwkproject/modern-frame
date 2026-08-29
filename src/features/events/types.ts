import type { EventStatus, EventType } from '@/types/database';

export type HostEvent = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  eventType: EventType;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  status: EventStatus;
};

export type PublicEvent = Omit<HostEvent, 'id'>;
