import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/schemas';

describe('authentication input', () => {
  it('normalizes registration identity fields', () => {
    expect(
      registerSchema.parse({
        displayName: '  Maya   Putri ',
        email: ' MAYA@EXAMPLE.COM ',
        password: 'safe-passphrase',
      }),
    ).toEqual({
      displayName: 'Maya Putri',
      email: 'maya@example.com',
      password: 'safe-passphrase',
    });
  });

  it('rejects short passwords and malformed emails', () => {
    expect(
      loginSchema.safeParse({ email: 'not-an-email', password: 'short' })
        .success,
    ).toBe(false);
  });
});
