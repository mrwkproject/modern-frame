import type { CameraErrorCode } from '@/features/camera/types';

export type VideoStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'recording'
  | 'processing'
  | 'captured'
  | 'accepted'
  | 'error';

export type VideoErrorCode =
  | CameraErrorCode
  | 'recorder-unsupported'
  | 'recording-failed'
  | 'empty-recording'
  | 'unexpected-stop';

export type VideoState = {
  status: VideoStatus;
  remainingSeconds: number;
  error: VideoErrorCode | null;
};

export type LocalVideoCapture = {
  blob: Blob;
  objectUrl: string;
  mimeType: string;
  durationMs: number;
};
