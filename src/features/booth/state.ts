import type { CameraErrorCode, LocalCapture } from '@/features/camera/types';

export type BoothStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'countdown'
  | 'between-shots'
  | 'review'
  | 'retake-requesting'
  | 'retake-ready'
  | 'retake-countdown'
  | 'layout-select'
  | 'error';

export type BoothState = {
  status: BoothStatus;
  shotIndex: number;
  countdown: number | null;
  retakeIndex: number | null;
  error: CameraErrorCode | null;
};

export const INITIAL_BOOTH_STATE: BoothState = {
  status: 'idle',
  shotIndex: 0,
  countdown: null,
  retakeIndex: null,
  error: null,
};

export type BoothAction =
  | { type: 'request-sequence' }
  | { type: 'restart-sequence' }
  | { type: 'request-retake'; index: number }
  | { type: 'switch-camera' }
  | { type: 'camera-ready' }
  | { type: 'start-countdown' }
  | { type: 'countdown'; value: number }
  | { type: 'shot-captured' }
  | { type: 'next-shot' }
  | { type: 'shot-replaced' }
  | { type: 'choose-layout' }
  | { type: 'back-to-review' }
  | { type: 'reset' }
  | { type: 'cancel'; hasCompleteSet: boolean }
  | { type: 'fail'; error: CameraErrorCode };

export function boothReducer(
  state: BoothState,
  action: BoothAction,
): BoothState {
  switch (action.type) {
    case 'request-sequence':
      if (state.status !== 'idle' && state.status !== 'error') return state;
      return { ...INITIAL_BOOTH_STATE, status: 'requesting' };
    case 'restart-sequence':
      return { ...INITIAL_BOOTH_STATE, status: 'requesting' };
    case 'request-retake':
      if (
        (state.status !== 'review' && state.status !== 'error') ||
        action.index < 0 ||
        action.index > 2
      )
        return state;
      return {
        ...state,
        status: 'retake-requesting',
        retakeIndex: action.index,
        error: null,
      };
    case 'switch-camera':
      if (state.status === 'ready') return { ...state, status: 'requesting' };
      if (state.status === 'retake-ready')
        return { ...state, status: 'retake-requesting' };
      return state;
    case 'camera-ready':
      if (state.status === 'requesting') return { ...state, status: 'ready' };
      if (state.status === 'retake-requesting')
        return { ...state, status: 'retake-ready' };
      return state;
    case 'start-countdown':
      if (state.status === 'ready')
        return { ...state, status: 'countdown', countdown: 3 };
      if (state.status === 'retake-ready')
        return { ...state, status: 'retake-countdown', countdown: 3 };
      return state;
    case 'countdown':
      if (state.status !== 'countdown' && state.status !== 'retake-countdown')
        return state;
      return { ...state, countdown: action.value };
    case 'shot-captured':
      if (state.status !== 'countdown') return state;
      if (state.shotIndex >= 2)
        return { ...state, status: 'review', countdown: null };
      return {
        ...state,
        status: 'between-shots',
        shotIndex: state.shotIndex + 1,
        countdown: null,
      };
    case 'next-shot':
      if (state.status !== 'between-shots') return state;
      return { ...state, status: 'countdown', countdown: 3 };
    case 'shot-replaced':
      if (state.status !== 'retake-countdown') return state;
      return {
        ...state,
        status: 'review',
        countdown: null,
        retakeIndex: null,
      };
    case 'choose-layout':
      if (state.status !== 'review') return state;
      return { ...state, status: 'layout-select' };
    case 'back-to-review':
      if (state.status !== 'layout-select') return state;
      return { ...state, status: 'review' };
    case 'reset':
      return INITIAL_BOOTH_STATE;
    case 'cancel':
      return action.hasCompleteSet
        ? { ...state, status: 'review', countdown: null, retakeIndex: null }
        : INITIAL_BOOTH_STATE;
    case 'fail':
      return {
        ...state,
        status: 'error',
        countdown: null,
        error: action.error,
      };
  }
}

export function replaceBoothCapture(
  captures: readonly LocalCapture[],
  index: number,
  capture: LocalCapture,
) {
  if (index < 0 || index > 2) throw new Error('INVALID_BOOTH_CAPTURE_INDEX');
  if (index > captures.length) throw new Error('BOOTH_CAPTURE_SEQUENCE_GAP');
  const next = captures.slice(0, 3);
  const replaced = next[index] ?? null;
  next[index] = capture;
  return { captures: next, replaced };
}
