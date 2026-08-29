'use server';

import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { decideHostDestination } from '@/features/auth/decisions';
import { friendlyAuthError } from '@/features/auth/errors';
import { loginSchema, registerSchema } from '@/features/auth/schemas';
import type { FormState } from '@/features/auth/types';
import { getPublicEnv } from '@/lib/env';

function valuesFrom(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function destinationFor(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw new Error('MEMBERSHIP_LOOKUP_FAILED');
  const destination = decideHostDestination({
    authenticated: true,
    hasMembership: data.length > 0,
  });
  return destination === '/dashboard' ? '/dashboard' : '/onboarding';
}

export async function loginAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse(valuesFrom(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return {
      status: 'error',
      message: error
        ? friendlyAuthError(error)
        : 'We could not sign you in. Try again.',
    };
  }

  let destination: '/dashboard' | '/onboarding';
  try {
    destination = await destinationFor(data.user.id);
  } catch {
    return {
      status: 'error',
      message:
        'You are signed in, but we could not load your workspace. Refresh and try again.',
    };
  }

  redirect(destination);
}

export async function registerAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse(valuesFrom(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const env = getPublicEnv();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/onboarding`,
    },
  });

  if (error || !data.user) {
    return {
      status: 'error',
      message: error
        ? friendlyAuthError(error)
        : 'We could not create your account. Try again.',
    };
  }

  if (!data.session) {
    return {
      status: 'success',
      message:
        'Check your inbox to confirm your email, then return here to sign in.',
    };
  }

  redirect('/onboarding');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
