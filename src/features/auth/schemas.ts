import { z } from 'zod';

const email = z
  .string()
  .trim()
  .email('Enter a valid email address.')
  .max(254, 'Email address is too long.')
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(72, 'Password must contain at most 72 characters.');

export const loginSchema = z.object({ email, password });

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must contain at least 2 characters.')
    .max(100, 'Display name must contain at most 100 characters.')
    .transform((value) => value.replace(/\s+/g, ' ')),
  email,
  password,
});
