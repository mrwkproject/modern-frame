import { describe, expect, it } from 'vitest';
import {
  canManageOrganization,
  hasOrganizationMembership,
} from '@/features/organizations/guards';

describe('organization authorization helpers', () => {
  const memberships = [{ organizationId: 'organization-a' }];

  it('accepts a matching organization membership', () => {
    expect(hasOrganizationMembership(memberships, 'organization-a')).toBe(true);
  });

  it('rejects an unrelated organization', () => {
    expect(hasOrganizationMembership(memberships, 'organization-b')).toBe(
      false,
    );
  });

  it('limits management to owner and admin roles', () => {
    expect(canManageOrganization('owner')).toBe(true);
    expect(canManageOrganization('admin')).toBe(true);
    expect(canManageOrganization('member')).toBe(false);
  });
});
