import { describe, expect, it } from 'vitest';
import { eventFormSchema } from '@/features/events/schemas';
import { canManageEvent } from '@/features/events/guards';
import { eventSlugCandidate, normalizeEventSlug } from '@/features/events/slug';
import { canTransitionEvent } from '@/features/events/status';
import { isoToEventInputs, zonedDateTimeToIso } from '@/features/events/time';

describe('event slugs', () => {
  it('normalizes names and appends deterministic collision suffixes', () => {
    const base = normalizeEventSlug('  Rani & Déva Wedding!  ');
    expect(base).toBe('rani-deva-wedding');
    expect(eventSlugCandidate(base, 1)).toBe('rani-deva-wedding');
    expect(eventSlugCandidate(base, 2)).toBe('rani-deva-wedding-2');
  });
});

describe('event validation and timezone conversion', () => {
  it('accepts a complete event and normalizes optional description', () => {
    const result = eventFormSchema.parse({
      name: ' Launch Night ',
      eventType: 'brand_activation',
      date: '2026-09-12',
      startTime: '18:00',
      endTime: '22:00',
      timezone: 'Asia/Jakarta',
      description: ' ',
    });
    expect(result.name).toBe('Launch Night');
    expect(result.description).toBeNull();
  });

  it('round-trips local event time through UTC', () => {
    const iso = zonedDateTimeToIso('2026-09-12', '18:30', 'Asia/Jakarta');
    expect(iso).toBe('2026-09-12T11:30:00.000Z');
    expect(isoToEventInputs(iso, 'Asia/Jakarta')).toEqual({
      date: '2026-09-12',
      time: '18:30',
    });
  });
});

describe('event lifecycle', () => {
  it('allows only forward lifecycle transitions', () => {
    expect(canTransitionEvent('draft', 'active')).toBe(true);
    expect(canTransitionEvent('active', 'ended')).toBe(true);
    expect(canTransitionEvent('ended', 'archived')).toBe(true);
    expect(canTransitionEvent('ended', 'active')).toBe(false);
    expect(canTransitionEvent('archived', 'draft')).toBe(false);
  });
});

describe('organization event authorization', () => {
  it('requires a managing role in the event organization', () => {
    expect(
      canManageEvent({
        membershipOrganizationId: 'org-a',
        eventOrganizationId: 'org-a',
        role: 'owner',
      }),
    ).toBe(true);
    expect(
      canManageEvent({
        membershipOrganizationId: 'org-a',
        eventOrganizationId: 'org-b',
        role: 'owner',
      }),
    ).toBe(false);
    expect(
      canManageEvent({
        membershipOrganizationId: 'org-a',
        eventOrganizationId: 'org-a',
        role: 'member',
      }),
    ).toBe(false);
  });
});
