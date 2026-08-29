import { z } from 'zod';
import type { FrameTemplate } from '@/features/frames/types';

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const rectSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  zIndex: z.number().int(),
  rotation: z.number().min(-360).max(360).optional(),
});

const photoSlotSchema = rectSchema.extend({
  id: z.string().min(1),
  kind: z.literal('photo'),
  cornerRadius: z.number().nonnegative().optional(),
});

const shapeSchema = rectSchema.extend({
  id: z.string().min(1),
  kind: z.literal('shape'),
  fill: colorSchema,
  cornerRadius: z.number().nonnegative().optional(),
});

const borderSchema = rectSchema.extend({
  id: z.string().min(1),
  kind: z.literal('border'),
  color: colorSchema,
  lineWidth: z.number().positive(),
  cornerRadius: z.number().nonnegative().optional(),
});

const textSchema = rectSchema.extend({
  id: z.string().min(1),
  kind: z.literal('text'),
  content: z.enum(['event-name', 'brand', 'literal']),
  value: z.string().optional(),
  color: colorSchema,
  fontFamily: z.enum(['serif', 'sans-serif']),
  fontSize: z.number().positive(),
  fontWeight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
  ]),
  lineHeight: z.number().positive(),
  maxLines: z.number().int().positive().max(4),
  align: z.enum(['left', 'center', 'right']),
});

const templateSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1).max(60),
    description: z.string().min(1).max(160),
    canvas: z.object({
      width: z.number().int().positive().max(6000),
      height: z.number().int().positive().max(6000),
    }),
    background: z.object({ color: colorSchema }),
    photoSlots: z.array(photoSlotSchema).min(1),
    elements: z.array(
      z.discriminatedUnion('kind', [shapeSchema, borderSchema, textSchema]),
    ),
  })
  .superRefine((template, context) => {
    const drawables = [...template.photoSlots, ...template.elements];
    for (const drawable of drawables) {
      if (
        drawable.x + drawable.width > template.canvas.width ||
        drawable.y + drawable.height > template.canvas.height
      ) {
        context.addIssue({
          code: 'custom',
          message: `${drawable.id} exceeds canvas bounds`,
          path: [drawable.kind === 'photo' ? 'photoSlots' : 'elements'],
        });
      }
    }
  });

export function validateFrameTemplate(template: unknown): FrameTemplate {
  return templateSchema.parse(template) as FrameTemplate;
}
