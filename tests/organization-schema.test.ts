import { describe, expect, it } from 'vitest';
import { organizationSchema } from '@/features/organizations/schemas';
import { createOrganizationSlug } from '@/features/organizations/slug';

describe('organization onboarding input', () => {
  it('normalizes repeated whitespace', () => {
    expect(
      organizationSchema.parse({ organizationName: '  Modern   Frame  ' }),
    ).toEqual({ organizationName: 'Modern Frame' });
  });

  it('creates a safe non-sequential public slug', () => {
    expect(createOrganizationSlug('Doremika Events', 'AB12-CD34')).toBe(
      'doremika-events-ab12cd34',
    );
  });
});
