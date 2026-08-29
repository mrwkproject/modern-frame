import { z } from 'zod';

export const organizationSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, 'Enter a workspace name.')
    .max(120, 'Workspace name must contain at most 120 characters.')
    .transform((value) => value.replace(/\s+/g, ' ')),
});
