import { VIDEO_DURATION_SECONDS } from '@/features/video/helpers';
import type {
  LocalVideoCapture,
  VideoErrorCode,
  VideoState,
  VideoStatus,
} from '@/features/video/types';

export const INITIAL_VIDEO_STATE: VideoState = {
  status: 'idle',
  remainingSeconds: VIDEO_DURATION_SECONDS,
  error: null,
};

const LEGAL_TRANSITIONS: Record<VideoStatus, ReadonlyArray<VideoStatus>> = {
  idle: ['requesting', 'error'],
  requesting: ['ready', 'idle', 'error'],
  ready: ['requesting', 'recording', 'idle', 'error'],
  recording: ['processing', 'idle', 'error'],
  processing: ['captured', 'idle', 'error'],
  captured: ['ready', 'requesting', 'accepted', 'idle'],
  accepted: ['ready', 'requesting', 'idle'],
  error: ['requesting', 'idle'],
};

export type VideoAction =
  | { type: 'transition'; status: VideoStatus }
  | { type: 'tick'; remainingSeconds: number }
  | { type: 'fail'; error: VideoErrorCode }
  | { type: 'reset' };

export function videoReducer(
  state: VideoState,
  action: VideoAction,
): VideoState {
  if (action.type === 'reset') return INITIAL_VIDEO_STATE;
  if (action.type === 'tick') {
    if (state.status !== 'recording') return state;
    return {
      ...state,
      remainingSeconds: Math.max(
        0,
        Math.min(VIDEO_DURATION_SECONDS, action.remainingSeconds),
      ),
    };
  }
  if (action.type === 'fail') {
    if (!LEGAL_TRANSITIONS[state.status].includes('error')) return state;
    return { ...INITIAL_VIDEO_STATE, status: 'error', error: action.error };
  }
  if (!LEGAL_TRANSITIONS[state.status].includes(action.status)) return state;
  return {
    status: action.status,
    remainingSeconds: VIDEO_DURATION_SECONDS,
    error: null,
  };
}

export function replaceLocalVideo(
  current: LocalVideoCapture | null,
  next: LocalVideoCapture | null,
) {
  return { next, revokedObjectUrl: current?.objectUrl ?? null };
}
