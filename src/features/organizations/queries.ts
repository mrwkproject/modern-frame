import 'server-only';

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/types/database';

export type PrimaryOrganization = {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
};

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (
      error.name === 'AuthSessionMissingError' ||
      error.code === 'session_not_found'
    ) {
      return null;
    }
    throw new Error('AUTH_LOOKUP_FAILED');
  }
  if (!data.user) return null;
  return data.user;
}

export async function getOwnProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error('PROFILE_LOOKUP_FAILED');
  return data;
}

export async function getPrimaryOrganization(
  userId: string,
): Promise<PrimaryOrganization | null> {
  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw new Error('MEMBERSHIP_LOOKUP_FAILED');
  if (!membership) return null;

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', membership.organization_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (organizationError || !organization) {
    throw new Error('ORGANIZATION_MEMBERSHIP_BROKEN');
  }

  return { ...organization, role: membership.role };
}
