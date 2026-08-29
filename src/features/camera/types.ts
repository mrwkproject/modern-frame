export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'countdown'
  | 'captured'
  | 'frame-select'
  | 'error';

export type CameraErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'not-readable'
  | 'unsupported'
  | 'capture-failed'
  | 'generic';

export type CameraState = {
  status: CameraStatus;
  countdown: number | null;
  error: CameraErrorCode | null;
};

export type LocalCapture = {
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
};
