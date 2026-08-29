'use server';

import 'server-only';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FormState } from '@/features/auth/types';
import { canManageOrganization } from '@/features/organizations/guards';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';
import { eventFormSchema } from '@/features/events/schemas';
import { eventSlugCandidate, normalizeEventSlug } from '@/features/events/slug';
import { canTransitionEvent } from '@/features/events/status';
import { zonedDateTimeToIso } from '@/features/events/time';
import { createClient } from '@/lib/supabase/server';
import type { EventStatus } from '@/types/database';

function eventValues(formData: FormData) {
  return {
    name: formData.get('name'),
    eventType: formData.get('eventType'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    timezone: formData.get('timezone'),
    description: formData.get('description'),
  };
}

function invalidFormState(
  message: string,
  fieldErrors?: FormState['fieldErrors'],
): FormState {
  return { status: 'error', message, fieldErrors };
}

async function requireEventManager() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const organization = await getPrimaryOrganization(user.id);
  if (!organization) redirect('/onboarding');
  if (!canManageOrganization(organization.role)) return null;
  return { user, organization };
}

function eventInstants(input: {
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
}) {
  const startsAt = zonedDateTimeToIso(
    input.date,
    input.startTime,
    input.timezone,
  );
  const endsAt = zonedDateTimeToIso(input.date, input.endTime, input.timezone);
  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new Error('END_BEFORE_START');
  }
  return { startsAt, endsAt };
}

export async function createEventAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = eventFormSchema.safeParse(eventValues(formData));
  if (!parsed.success) {
    return invalidFormState(
      'Check the highlighted event details and try again.',
      parsed.error.flatten().fieldErrors,
    );
  }

  let instants: ReturnType<typeof eventInstants>;
  try {
    instants = eventInstants(parsed.data);
  } catch {
    return invalidFormState('End time must be after start time.', {
      endTime: ['Choose a time later than the start time.'],
    });
  }

  const context = await requireEventManager();
  if (!context) {
    return invalidFormState(
      'Only workspace owners and admins can create events.',
    );
  }

  const supabase = await createClient();
  const baseSlug = normalizeEventSlug(parsed.data.name);

  for (let attempt = 1; attempt <= 25; attempt += 1) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        organization_id: context.organization.id,
        name: parsed.data.name,
        slug: eventSlugCandidate(baseSlug, attempt),
        description: parsed.data.description,
        event_type: parsed.data.eventType,
        starts_at: instants.startsAt,
        ends_at: instants.endsAt,
        timezone: parsed.data.timezone,
        status: 'draft',
        created_by: context.user.id,
      })
      .select('id')
      .single();

    if (!error && data) redirect(`/dashboard/events/${data.id}`);
    if (error?.code !== '23505') {
      return invalidFormState(
        'We could not create this event. Check your connection and try again.',
      );
    }
  }

  return invalidFormState(
    'That event name is already in use. Try a more distinctive name.',
  );
}

export async function updateEventAction(
  eventId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = eventFormSchema.safeParse(eventValues(formData));
  if (!parsed.success) {
    return invalidFormState(
      'Check the highlighted event details and try again.',
      parsed.error.flatten().fieldErrors,
    );
  }

  let instants: ReturnType<typeof eventInstants>;
  try {
    instants = eventInstants(parsed.data);
  } catch {
    return invalidFormState('End time must be after start time.', {
      endTime: ['Choose a time later than the start time.'],
    });
  }

  const context = await requireEventManager();
  if (!context) {
    return invalidFormState(
      'Only workspace owners and admins can update events.',
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      event_type: parsed.data.eventType,
      starts_at: instants.startsAt,
      ends_at: instants.endsAt,
      timezone: parsed.data.timezone,
    })
    .eq('id', eventId)
    .eq('organization_id', context.organization.id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    return invalidFormState(
      'We could not update this event. It may be unavailable or outside your workspace.',
    );
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/events');
  revalidatePath(`/dashboard/events/${eventId}`);
  return { status: 'success', message: 'Event settings saved.' };
}

async function transitionEvent(eventId: string, nextStatus: EventStatus) {
  const context = await requireEventManager();
  if (!context) return;
  const supabase = await createClient();
  const { data: event, error: lookupError } = await supabase
    .from('events')
    .select('status')
    .eq('id', eventId)
    .eq('organization_id', context.organization.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (lookupError || !event || !canTransitionEvent(event.status, nextStatus)) {
    return;
  }

  const { error } = await supabase
    .from('events')
    .update({ status: nextStatus })
    .eq('id', eventId)
    .eq('organization_id', context.organization.id)
    .eq('status', event.status);

  if (!error) {
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${eventId}`);
  }
}

export async function activateEventAction(eventId: string) {
  await transitionEvent(eventId, 'active');
}

export async function endEventAction(eventId: string) {
  await transitionEvent(eventId, 'ended');
}

export async function archiveEventAction(eventId: string) {
  await transitionEvent(eventId, 'archived');
  redirect('/dashboard/events');
}
