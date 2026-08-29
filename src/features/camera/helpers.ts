import type {
  CameraErrorCode,
  CameraState,
  CameraStatus,
} from '@/features/camera/types';

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function calculateCoverCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect = 3 / 4,
) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetAspect <= 0) {
    throw new Error('INVALID_CAPTURE_DIMENSIONS');
  }
  const sourceAspect = sourceWidth / sourceHeight;
  if (sourceAspect > targetAspect) {
    const width = sourceHeight * targetAspect;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }
  const height = sourceWidth / targetAspect;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
}

export function classifyCameraError(error: unknown): CameraErrorCode {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'permission-denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'not-found';
  if (name === 'NotReadableError' || name === 'AbortError')
    return 'not-readable';
  return 'generic';
}

const LEGAL_TRANSITIONS: Record<CameraStatus, ReadonlyArray<CameraStatus>> = {
  idle: ['requesting', 'error'],
  requesting: ['ready', 'error'],
  ready: ['requesting', 'countdown', 'error', 'idle'],
  countdown: ['countdown', 'captured', 'error', 'idle'],
  captured: ['requesting', 'accepted', 'idle'],
  accepted: ['requesting', 'idle'],
  error: ['requesting', 'idle'],
};

export type CameraAction =
  | { type: 'transition'; status: CameraStatus; error?: CameraErrorCode }
  | { type: 'countdown'; value: number };

export function cameraReducer(
  state: CameraState,
  action: CameraAction,
): CameraState {
  if (action.type === 'countdown') {
    if (state.status !== 'countdown') return state;
    return { ...state, countdown: action.value };
  }
  if (!LEGAL_TRANSITIONS[state.status].includes(action.status)) return state;
  return {
    status: action.status,
    countdown: action.status === 'countdown' ? 3 : null,
    error: action.error ?? null,
  };
}

export const CAMERA_ERROR_COPY: Record<
  CameraErrorCode,
  { title: string; detail: string }
> = {
  'permission-denied': {
    title: 'Camera access is blocked.',
    detail: 'Allow camera access in your browser settings, then try again.',
  },
  'not-found': {
    title: 'No camera was found.',
    detail: 'Connect or enable a camera, then try again.',
  },
  'not-readable': {
    title: 'The camera is unavailable.',
    detail: 'Another app may be using your camera. Close it, then try again.',
  },
  unsupported: {
    title: 'Camera access is not available in this browser.',
    detail:
      'Use a current browser over HTTPS, or localhost during development.',
  },
  'capture-failed': {
    title: "We couldn't take the photo.",
    detail: 'Keep the camera steady and try again.',
  },
  generic: {
    title: "We couldn't start the camera.",
    detail: 'Check your camera and try again.',
  },
};
