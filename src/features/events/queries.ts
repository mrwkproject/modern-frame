import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { HostEvent, PublicEvent } from '@/features/events/types';

const HOST_EVENT_COLUMNS =
  'id, name, slug, description, event_type, starts_at, ends_at, timezone, status';

function toHostEvent(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  event_type: HostEvent['eventType'];
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  status: HostEvent['status'];
}): HostEvent {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    status: row.status,
  };
}

export async function listOrganizationEvents(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select(HOST_EVENT_COLUMNS)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .neq('status', 'archived')
    .order('starts_at', { ascending: false, nullsFirst: false })
    .range(0, 49);

  if (error) throw new Error('EVENT_LIST_FAILED');
  return data.map(toHostEvent);
}

export async function getOrganizationEvent(
  organizationId: string,
  eventId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select(HOST_EVENT_COLUMNS)
    .eq('organization_id', organizationId)
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error('EVENT_LOOKUP_FAILED');
  return data ? toHostEvent(data) : null;
}

export async function getPublicEvent(
  eventSlug: string,
): Promise<PublicEvent | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(eventSlug)) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('get_public_event_by_slug', {
    event_slug: eventSlug,
  });

  if (error) throw new Error('PUBLIC_EVENT_LOOKUP_FAILED');
  const event = data[0];
  if (!event) return null;
  return {
    name: event.name,
    slug: event.slug,
    description: event.description,
    eventType: event.event_type,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    timezone: event.timezone,
    status: event.status,
  };
}
