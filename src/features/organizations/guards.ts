import type { OrganizationRole } from '@/types/database';

export function hasOrganizationMembership(
  memberships: ReadonlyArray<{ organizationId: string }>,
  organizationId: string,
) {
  return memberships.some(
    (membership) => membership.organizationId === organizationId,
  );
}

export function canManageOrganization(role: OrganizationRole) {
  return role === 'owner' || role === 'admin';
}
