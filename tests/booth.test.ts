import { describe, expect, it } from 'vitest';
import {
  INITIAL_BOOTH_STATE,
  boothReducer,
  replaceBoothCapture,
} from '@/features/booth/state';
import { resolveCaptureMode } from '@/features/camera/modes';
import type { LocalCapture } from '@/features/camera/types';

function capture(index: number): LocalCapture {
  return {
    blob: new Blob([`${index}`], { type: 'image/jpeg' }),
    objectUrl: `blob:booth-${index}`,
    width: 900,
    height: 1200,
    mimeType: 'image/jpeg',
  };
}

describe('capture modes', () => {
  it('allowlists the hub, single photo, and three-shot booth', () => {
    expect(resolveCaptureMode(undefined)).toBe('hub');
    expect(resolveCaptureMode('single')).toBe('single');
    expect(resolveCaptureMode('booth3')).toBe('booth3');
    expect(resolveCaptureMode('video')).toBe('video');
    expect(resolveCaptureMode(['single'])).toBe('invalid');
  });
});

describe('three-shot state model', () => {
  it('progresses exactly from shot one through shot three to review', () => {
    let state = boothReducer(INITIAL_BOOTH_STATE, {
      type: 'request-sequence',
    });
    state = boothReducer(state, { type: 'camera-ready' });
    state = boothReducer(state, { type: 'start-countdown' });
    expect(state).toMatchObject({ status: 'countdown', shotIndex: 0 });

    state = boothReducer(state, { type: 'shot-captured' });
    expect(state).toMatchObject({ status: 'between-shots', shotIndex: 1 });
    state = boothReducer(state, { type: 'next-shot' });
    state = boothReducer(state, { type: 'shot-captured' });
    expect(state).toMatchObject({ status: 'between-shots', shotIndex: 2 });
    state = boothReducer(state, { type: 'next-shot' });
    state = boothReducer(state, { type: 'shot-captured' });
    expect(state).toMatchObject({ status: 'review', shotIndex: 2 });
    expect(boothReducer(state, { type: 'shot-captured' })).toBe(state);
  });

  it('rejects invalid transitions and safely cancels active states', () => {
    expect(boothReducer(INITIAL_BOOTH_STATE, { type: 'choose-layout' })).toBe(
      INITIAL_BOOTH_STATE,
    );
    const requesting = boothReducer(INITIAL_BOOTH_STATE, {
      type: 'request-sequence',
    });
    expect(
      boothReducer(requesting, { type: 'cancel', hasCompleteSet: false }),
    ).toEqual(INITIAL_BOOTH_STATE);
    expect(
      boothReducer(requesting, { type: 'cancel', hasCompleteSet: true }),
    ).toMatchObject({ status: 'review' });
  });

  it('returns a single retake to review without changing the target index', () => {
    const review = { ...INITIAL_BOOTH_STATE, status: 'review' as const };
    let state = boothReducer(review, { type: 'request-retake', index: 1 });
    state = boothReducer(state, { type: 'camera-ready' });
    state = boothReducer(state, { type: 'start-countdown' });
    expect(state).toMatchObject({
      status: 'retake-countdown',
      retakeIndex: 1,
    });
    state = boothReducer(state, { type: 'shot-replaced' });
    expect(state).toMatchObject({ status: 'review', retakeIndex: null });
  });
});

describe('booth capture memory model', () => {
  it('replaces only one selected capture and returns the discarded capture', () => {
    const original = [capture(0), capture(1), capture(2)];
    const replacement = capture(9);
    const result = replaceBoothCapture(original, 1, replacement);
    expect(result.captures).toEqual([original[0], replacement, original[2]]);
    expect(result.replaced).toBe(original[1]);
    expect(original[1]!.objectUrl).toBe('blob:booth-1');
  });

  it('does not permit a fourth capture slot', () => {
    expect(() => replaceBoothCapture([], 3, capture(3))).toThrow(
      'INVALID_BOOTH_CAPTURE_INDEX',
    );
  });

  it('does not permit a gap in automatic shot ordering', () => {
    expect(() => replaceBoothCapture([], 1, capture(1))).toThrow(
      'BOOTH_CAPTURE_SEQUENCE_GAP',
    );
  });
});
