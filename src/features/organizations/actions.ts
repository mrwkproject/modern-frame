'use server';

import 'server-only';

import { redirect } from 'next/navigation';
import { createOrganizationSlug } from '@/features/organizations/slug';
import { organizationSchema } from '@/features/organizations/schemas';
import type { FormState } from '@/features/auth/types';
import { createClient } from '@/lib/supabase/server';

export async function createOrganizationAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = organizationSchema.safeParse({
    organizationName: formData.get('organizationName'),
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the workspace name and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/login');

  const { data: existing, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userData.user.id)
    .limit(1);

  if (membershipError) {
    return {
      status: 'error',
      message: 'We could not verify your account. Refresh and try again.',
    };
  }
  if (existing.length > 0) redirect('/dashboard');

  const slug = createOrganizationSlug(
    parsed.data.organizationName,
    crypto.randomUUID(),
  );
  const { error } = await supabase.from('organizations').insert({
    name: parsed.data.organizationName,
    slug,
    created_by: userData.user.id,
  });

  if (error) {
    return {
      status: 'error',
      message:
        'We could not create your workspace. Check your connection and try again.',
    };
  }

  // The existing database trigger creates the owner membership atomically.
  redirect('/dashboard');
}
