export type HostDestination = '/login' | '/onboarding' | '/dashboard';

export function decideHostDestination(input: {
  authenticated: boolean;
  hasMembership: boolean;
}): HostDestination {
  if (!input.authenticated) return '/login';
  return input.hasMembership ? '/dashboard' : '/onboarding';
}

export function safeAuthRedirect(
  value: string | null,
): '/dashboard' | '/onboarding' {
  return value === '/dashboard' ? '/dashboard' : '/onboarding';
}
