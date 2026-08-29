import { calculateCoverCrop, stopMediaStream } from '@/features/camera/helpers';
import type { LocalCapture } from '@/features/camera/types';

export async function requestCameraStream(facing: 'environment' | 'user') {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: facing } },
  });
}

export async function countVideoInputs() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput').length;
  } catch {
    return 1;
  }
}

export async function createLocalCaptureFromVideo(
  video: HTMLVideoElement,
): Promise<LocalCapture> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('CAPTURE_DIMENSIONS_UNAVAILABLE');
  }
  const crop = calculateCoverCrop(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  if (canvas.width <= 0 || canvas.height <= 0) {
    throw new Error('CAPTURE_DIMENSIONS_INVALID');
  }
  const context = canvas.getContext('2d');
  if (!context) throw new Error('CAPTURE_CONTEXT_UNAVAILABLE');
  context.drawImage(
    video,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result || result.size === 0) {
          reject(new Error('CAPTURE_ENCODING_FAILED'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      0.92,
    );
  });
  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
    mimeType: 'image/jpeg',
  };
}

export function attachCameraStream(
  video: HTMLVideoElement,
  stream: MediaStream,
) {
  video.srcObject = stream;
  return video.play().catch((error: unknown) => {
    stopMediaStream(stream);
    video.srcObject = null;
    throw error;
  });
}
