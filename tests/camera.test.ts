import { describe, expect, it, vi } from 'vitest';
import {
  calculateCoverCrop,
  cameraReducer,
  classifyCameraError,
  stopMediaStream,
} from '@/features/camera/helpers';

describe('camera preview crop', () => {
  it('center-crops a landscape sensor to portrait 3:4 without stretching', () => {
    const crop = calculateCoverCrop(4032, 3024);
    expect(crop).toEqual({ x: 882, y: 0, width: 2268, height: 3024 });
    expect(crop.width / crop.height).toBeCloseTo(0.75);
  });

  it('center-crops a tall portrait sensor with valid coordinates', () => {
    const crop = calculateCoverCrop(3024, 4032);
    expect(crop).toEqual({ x: 0, y: 0, width: 3024, height: 4032 });
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
  });
});

describe('camera errors', () => {
  it('maps browser exceptions to safe product errors', () => {
    expect(classifyCameraError(new DOMException('', 'NotAllowedError'))).toBe(
      'permission-denied',
    );
    expect(classifyCameraError(new DOMException('', 'NotFoundError'))).toBe(
      'not-found',
    );
    expect(classifyCameraError(new DOMException('', 'NotReadableError'))).toBe(
      'not-readable',
    );
  });
});

describe('camera lifecycle helpers', () => {
  it('stops every media track', () => {
    const first = { stop: vi.fn() };
    const second = { stop: vi.fn() };
    stopMediaStream({
      getTracks: () => [first, second],
    } as unknown as MediaStream);
    expect(first.stop).toHaveBeenCalledOnce();
    expect(second.stop).toHaveBeenCalledOnce();
  });

  it('allows legal state transitions and ignores illegal ones', () => {
    const idle = { status: 'idle', countdown: null, error: null } as const;
    const requesting = cameraReducer(idle, {
      type: 'transition',
      status: 'requesting',
    });
    const ready = cameraReducer(requesting, {
      type: 'transition',
      status: 'ready',
    });
    const countdown = cameraReducer(ready, {
      type: 'transition',
      status: 'countdown',
    });
    expect(countdown).toEqual({
      status: 'countdown',
      countdown: 3,
      error: null,
    });
    expect(
      cameraReducer(requesting, { type: 'transition', status: 'idle' }),
    ).toEqual(idle);
    const frameSelect = cameraReducer(
      { status: 'captured', countdown: null, error: null },
      { type: 'transition', status: 'frame-select' },
    );
    expect(
      cameraReducer(frameSelect, { type: 'transition', status: 'requesting' }),
    ).toEqual(requesting);
    expect(
      cameraReducer(idle, { type: 'transition', status: 'captured' }),
    ).toBe(idle);
  });
});
