export const VIDEO_DURATION_SECONDS = 8;
export const VIDEO_DURATION_MS = VIDEO_DURATION_SECONDS * 1000;

export const VIDEO_MIME_CANDIDATES = [
  'video/mp4;codecs=h264',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const;

export function selectSupportedVideoMimeType(
  isTypeSupported: (mimeType: string) => boolean,
) {
  return VIDEO_MIME_CANDIDATES.find(isTypeSupported) ?? '';
}

export function videoFileExtension(mimeType: string) {
  const normalized = mimeType.toLowerCase().split(';', 1)[0]?.trim();
  if (normalized === 'video/mp4') return 'mp4';
  if (normalized === 'video/webm') return 'webm';
  if (normalized === 'video/ogg') return 'ogv';
  return 'video';
}

export function safeVideoFilename(eventName: string, mimeType: string) {
  const safeEventName = eventName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${safeEventName || 'event'}-video-modern-frame.${videoFileExtension(mimeType)}`;
}
