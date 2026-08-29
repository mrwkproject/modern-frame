import type { OrganizationRole } from '@/types/database';
import { canManageOrganization } from '@/features/organizations/guards';

export function canManageEvent(input: {
  membershipOrganizationId: string;
  eventOrganizationId: string;
  role: OrganizationRole;
}) {
  return (
    input.membershipOrganizationId === input.eventOrganizationId &&
    canManageOrganization(input.role)
  );
}
