import { z } from 'zod';
import { EVENT_TYPE_VALUES } from '@/features/events/constants';

const localDate = /^\d{4}-\d{2}-\d{2}$/;
const localTime = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const eventFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Event name must contain at least 2 characters.')
    .max(160, 'Event name must contain at most 160 characters.')
    .transform((value) => value.replace(/\s+/g, ' ')),
  eventType: z.enum(EVENT_TYPE_VALUES, {
    error: 'Choose a valid event type.',
  }),
  date: z.string().regex(localDate, 'Choose a valid event date.'),
  startTime: z.string().regex(localTime, 'Choose a valid start time.'),
  endTime: z.string().regex(localTime, 'Choose a valid end time.'),
  timezone: z
    .string()
    .trim()
    .min(1, 'Choose a timezone.')
    .max(100, 'Timezone is too long.')
    .refine(isValidTimeZone, 'Choose a valid IANA timezone.'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must contain at most 1,000 characters.')
    .transform((value) => value || null),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;
