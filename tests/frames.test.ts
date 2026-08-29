import { describe, expect, it } from 'vitest';
import {
  calculateSlotCoverCrop,
  createPhotoFilename,
  fitTextLines,
  scaleFrameRect,
} from '@/features/frames/helpers';
import { validateFrameTemplate } from '@/features/frames/schema';
import { SYSTEM_FRAME_TEMPLATES } from '@/features/frames/templates';

describe('system frame templates', () => {
  it('validates every built-in template at 1080 by 1440', () => {
    expect(SYSTEM_FRAME_TEMPLATES).toHaveLength(3);
    for (const template of SYSTEM_FRAME_TEMPLATES) {
      expect(validateFrameTemplate(template)).toEqual(template);
      expect(template.canvas).toEqual({ width: 1080, height: 1440 });
      expect(template.photoSlots).toHaveLength(1);
    }
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
