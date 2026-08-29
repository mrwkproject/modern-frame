import { describe, expect, it } from 'vitest';
import {
  calculateSlotCoverCrop,
  createPhotoFilename,
  fitTextLines,
  scaleFrameRect,
} from '@/features/frames/helpers';
import {
  validateBoothTemplate,
  validateFrameTemplate,
} from '@/features/frames/schema';
import {
  BOOTH_FRAME_TEMPLATES,
  SYSTEM_FRAME_TEMPLATES,
} from '@/features/frames/templates';
import { resolveFrameCaptures } from '@/features/frames/renderer';
import type { LocalCapture } from '@/features/camera/types';

function capture(index: number): LocalCapture {
  return {
    blob: new Blob([`${index}`], { type: 'image/jpeg' }),
    objectUrl: `blob:photo-${index}`,
    width: 900,
    height: 1200,
    mimeType: 'image/jpeg',
  };
}

describe('system frame templates', () => {
  it('validates every built-in template at 1080 by 1440', () => {
    expect(SYSTEM_FRAME_TEMPLATES).toHaveLength(3);
    for (const template of SYSTEM_FRAME_TEMPLATES) {
      expect(validateFrameTemplate(template)).toEqual(template);
      expect(template.canvas).toEqual({ width: 1080, height: 1440 });
      expect(template.photoSlots).toHaveLength(1);
      expect(template.photoSlots[0]!.slotIndex).toBe(0);
    }
  });

  it('validates three booth layouts and their explicit slot mapping', () => {
    expect(BOOTH_FRAME_TEMPLATES).toHaveLength(3);
    for (const template of BOOTH_FRAME_TEMPLATES) {
      expect(validateBoothTemplate(template)).toEqual(template);
      expect(template.photoSlots.map((slot) => slot.slotIndex)).toEqual([
        0, 1, 2,
      ]);
    }
    expect(BOOTH_FRAME_TEMPLATES[0]!.canvas).toEqual({
      width: 600,
      height: 1800,
    });
  });

  it('rejects a negative slot index', () => {
    const invalid = structuredClone(BOOTH_FRAME_TEMPLATES[0]!);
    invalid.photoSlots[0]!.slotIndex = -1;
    expect(() => validateFrameTemplate(invalid)).toThrow();
  });

  it('rejects booth layouts without the exact 0, 1, 2 slot mapping', () => {
    const invalid = structuredClone(BOOTH_FRAME_TEMPLATES[0]!);
    invalid.photoSlots[2]!.slotIndex = 1;
    expect(() => validateBoothTemplate(invalid)).toThrow(
      'BOOTH_TEMPLATE_REQUIRES_SLOTS_0_1_2',
    );
  });

  it('maps captures 0, 1, and 2 and rejects a missing required capture', () => {
    const captures = [capture(0), capture(1), capture(2)];
    const resolved = resolveFrameCaptures(captures, BOOTH_FRAME_TEMPLATES[0]!);
    expect(resolved.get(0)).toBe(captures[0]);
    expect(resolved.get(1)).toBe(captures[1]);
    expect(resolved.get(2)).toBe(captures[2]);
    expect(() =>
      resolveFrameCaptures(captures.slice(0, 2), BOOTH_FRAME_TEMPLATES[0]!),
    ).toThrow('MISSING_CAPTURE_FOR_SLOT_2');
    expect(
      resolveFrameCaptures([captures[0]!], SYSTEM_FRAME_TEMPLATES[0]!).get(0),
    ).toBe(captures[0]);
  });

  it('rejects elements outside the composition canvas', () => {
    const invalid = structuredClone(SYSTEM_FRAME_TEMPLATES[0]!);
    invalid.photoSlots[0]!.width = 2000;
    expect(() => validateFrameTemplate(invalid)).toThrow();
  });
});

describe('frame geometry', () => {
  it('cover-crops landscape and portrait sources without stretching', () => {
    const landscape = calculateSlotCoverCrop(4032, 3024, 900, 1200);
    const portrait = calculateSlotCoverCrop(3024, 4032, 900, 1200);
    expect(landscape).toEqual({ x: 882, y: 0, width: 2268, height: 3024 });
    expect(portrait).toEqual({ x: 0, y: 0, width: 3024, height: 4032 });
    expect(landscape.width / landscape.height).toBeCloseTo(0.75);
  });

  it('uses identical coordinate scaling for preview and full output', () => {
    expect(
      scaleFrameRect({ x: 90, y: 120, width: 900, height: 1200 }, 1 / 3),
    ).toEqual({
      x: 30,
      y: 40,
      width: 300,
      height: 400,
    });
  });
});

describe('dynamic frame content', () => {
  it('keeps a long event name inside the configured line limit and width', () => {
    const measure = (value: string) => value.length * 10;
    const lines = fitTextLines(
      'A Very Long Celebration Name That Must Stay Safely Inside The Frame',
      120,
      2,
      measure,
    );
    expect(lines).toHaveLength(2);
    expect(lines.every((line) => measure(line) <= 120)).toBe(true);
    expect(lines[1]!.endsWith('…')).toBe(true);
  });

  it('creates a safe local JPEG filename from untrusted display text', () => {
    expect(
      createPhotoFilename('../../Álan & Maya <script>', 'clean-ivory'),
    ).toBe('alan-maya-script-clean-ivory-modern-frame.jpg');
  });
});
