import { z } from 'zod';
import {
  BOOTH_TEMPLATE_IDS,
  MAX_MEDIA_BYTES,
  SINGLE_TEMPLATE_IDS,
} from '@/features/media/constants';

export const mediaIdSchema = z.uuid();
export const captureModeSchema = z.enum(['single', 'booth3']);

export const uploadIntentSchema = z
  .object({
    byteSize: z.number().int().min(1).max(MAX_MEDIA_BYTES),
    width: z.number().int().min(320).max(8192),
    height: z.number().int().min(320).max(8192),
    captureMode: captureModeSchema,
    templateId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    mimeType: z.literal('image/jpeg'),
  })
  .superRefine((value, context) => {
    const allowed =
      value.captureMode === 'single' ? SINGLE_TEMPLATE_IDS : BOOTH_TEMPLATE_IDS;
    if (!(allowed as readonly string[]).includes(value.templateId)) {
      context.addIssue({
        code: 'custom',
        path: ['templateId'],
        message: 'Template does not match the capture mode.',
      });
    }
  });

export const finalizeMediaSchema = z.object({ mediaId: mediaIdSchema });

export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;
