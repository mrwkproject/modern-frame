import { describe, expect, it } from 'vitest';
import {
  safeVideoFilename,
  selectSupportedVideoMimeType,
  VIDEO_DURATION_SECONDS,
  videoFileExtension,
} from '@/features/video/helpers';
import {
  INITIAL_VIDEO_STATE,
  replaceLocalVideo,
  videoReducer,
} from '@/features/video/state';
import type { LocalVideoCapture } from '@/features/video/types';

describe('video MIME negotiation', () => {
  it('selects the first supported candidate in preference order', () => {
    expect(
      selectSupportedVideoMimeType((type) =>
        ['video/mp4', 'video/webm'].includes(type),
      ),
    ).toBe('video/mp4');
  });

  it('allows MediaRecorder to choose its default when none match', () => {
    expect(selectSupportedVideoMimeType(() => false)).toBe('');
  });

  it('maps actual containers to matching extensions', () => {
    expect(videoFileExtension('video/mp4;codecs=h264')).toBe('mp4');
    expect(videoFileExtension('video/webm;codecs=vp8')).toBe('webm');
  });

  it('sanitizes event names without mislabeling the container', () => {
    expect(safeVideoFilename(' Maya & Rafi / 2026! ', 'video/webm')).toBe(
      'maya-rafi-2026-video-modern-frame.webm',
    );
    expect(safeVideoFilename('💛', 'video/mp4')).toBe(
      'event-video-modern-frame.mp4',
    );
  });
});

describe('video recording state', () => {
  it('moves through ready, recording, processing, and captured', () => {
    let state = videoReducer(INITIAL_VIDEO_STATE, {
      type: 'transition',
      status: 'requesting',
    });
    state = videoReducer(state, { type: 'transition', status: 'ready' });
    state = videoReducer(state, { type: 'transition', status: 'recording' });
    state = videoReducer(state, { type: 'tick', remainingSeconds: 3 });
    expect(state.remainingSeconds).toBe(3);
    state = videoReducer(state, {
      type: 'transition',
      status: 'processing',
    });
    state = videoReducer(state, { type: 'transition', status: 'captured' });
    expect(state.status).toBe('captured');
  });

  it('supports recording failure and reset', () => {
    const recording = {
      status: 'recording' as const,
      remainingSeconds: VIDEO_DURATION_SECONDS,
      error: null,
    };
    const failed = videoReducer(recording, {
      type: 'fail',
      error: 'recording-failed',
    });
    expect(failed.status).toBe('error');
    expect(videoReducer(failed, { type: 'reset' })).toEqual(
      INITIAL_VIDEO_STATE,
    );
  });

  it('supports retake and identifies the URL to revoke', () => {
    const capture = {
      blob: new Blob([], { type: 'video/webm' }),
      objectUrl: 'blob:old',
      mimeType: 'video/webm',
      durationMs: 8000,
    } satisfies LocalVideoCapture;
    expect(replaceLocalVideo(capture, null)).toEqual({
      next: null,
      revokedObjectUrl: 'blob:old',
    });
    const captured = {
      status: 'captured' as const,
      remainingSeconds: VIDEO_DURATION_SECONDS,
      error: null,
    };
    expect(
      videoReducer(captured, { type: 'transition', status: 'ready' }).status,
    ).toBe('ready');
  });

  it('ignores invalid transitions', () => {
    expect(
      videoReducer(INITIAL_VIDEO_STATE, {
        type: 'transition',
        status: 'captured',
      }),
    ).toBe(INITIAL_VIDEO_STATE);
  });
});
