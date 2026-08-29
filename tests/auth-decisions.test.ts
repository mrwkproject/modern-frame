import { describe, expect, it } from 'vitest';
import {
  decideHostDestination,
  safeAuthRedirect,
} from '@/features/auth/decisions';

describe('host auth decisions', () => {
  it('sends unauthenticated visitors to login', () => {
    expect(
      decideHostDestination({ authenticated: false, hasMembership: false }),
    ).toBe('/login');
  });

  it('sends a new authenticated user to onboarding', () => {
    expect(
      decideHostDestination({ authenticated: true, hasMembership: false }),
    ).toBe('/onboarding');
  });

  it('sends an organization member to the dashboard', () => {
    expect(
      decideHostDestination({ authenticated: true, hasMembership: true }),
    ).toBe('/dashboard');
  });

  it('rejects open redirect destinations', () => {
    expect(safeAuthRedirect('https://evil.example')).toBe('/onboarding');
    expect(safeAuthRedirect('/dashboard')).toBe('/dashboard');
  });
});
