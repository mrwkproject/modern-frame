'use client';

import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  attachCameraStream,
  countVideoInputs,
  requestCameraStream,
} from '@/features/camera/browser';
import {
  CAMERA_ERROR_COPY,
  classifyCameraError,
  stopMediaStream,
} from '@/features/camera/helpers';
import {
  safeVideoFilename,
  selectSupportedVideoMimeType,
  VIDEO_DURATION_MS,
  VIDEO_DURATION_SECONDS,
} from '@/features/video/helpers';
import { INITIAL_VIDEO_STATE, videoReducer } from '@/features/video/state';
import type { LocalVideoCapture, VideoErrorCode } from '@/features/video/types';

const VIDEO_ERROR_COPY: Record<
  VideoErrorCode,
  { title: string; detail: string }
> = {
  ...CAMERA_ERROR_COPY,
  'recorder-unsupported': {
    title: 'Video recording is not available.',
    detail: 'Try a current version of Safari or Chrome over HTTPS.',
  },
  'recording-failed': {
    title: "We couldn't record this video.",
    detail: 'Your camera is safe. Try opening it again and record once more.',
  },
  'empty-recording': {
    title: 'No video was captured.',
    detail: 'Keep this page visible and try recording again.',
  },
  'unexpected-stop': {
    title: 'Recording stopped unexpectedly.',
    detail: 'Check that the camera is available, then try again.',
  },
};

export function VideoBooth({
  eventName,
  eventSlug,
}: {
  eventName: string;
  eventSlug: string;
}) {
  const [state, dispatch] = useReducer(videoReducer, INITIAL_VIDEO_STATE);
  const [capture, setCapture] = useState<LocalVideoCapture | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraCount, setCameraCount] = useState(1);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const captureRef = useRef<LocalVideoCapture | null>(null);
  const operationRef = useRef(false);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);
  const stateRef = useRef(state);
  const stopRequestedRef = useRef(false);
  const discardOnStopRef = useRef(false);
  const recordingStartedAtRef = useRef(0);
  const stopTimeoutRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  const clearRecordingTimers = useCallback(() => {
    if (stopTimeoutRef.current !== null)
      window.clearTimeout(stopTimeoutRef.current);
    if (tickIntervalRef.current !== null)
      window.clearInterval(tickIntervalRef.current);
    stopTimeoutRef.current = null;
    tickIntervalRef.current = null;
  }, []);

  const discardCapture = useCallback(() => {
    const current = captureRef.current;
    if (current) URL.revokeObjectURL(current.objectUrl);
    captureRef.current = null;
    setCapture(null);
  }, []);

  const releaseCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
  }, []);

  const cancelRecording = useCallback(() => {
    clearRecordingTimers();
    discardOnStopRef.current = true;
    stopRequestedRef.current = true;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        try {
          recorder.stop();
        } catch {
          // A concurrent browser stop is already terminal; cleanup continues.
        }
      }
    }
    chunksRef.current = [];
  }, [clearRecordingTimers]);

  const cancelSession = useCallback(
    (discardResult: boolean) => {
      generationRef.current += 1;
      operationRef.current = false;
      cancelRecording();
      releaseCamera();
      if (discardResult) discardCapture();
    },
    [cancelRecording, discardCapture, releaseCamera],
  );

  const failVideoSession = useCallback(
    (error: VideoErrorCode) => {
      cancelSession(false);
      dispatch({ type: 'fail', error });
    },
    [cancelSession],
  );

  const startCamera = useCallback(
    async (preferredFacing: 'environment' | 'user' = facing) => {
      if (operationRef.current || stateRef.current.status === 'recording')
        return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        failVideoSession('unsupported');
        return;
      }
      if (typeof MediaRecorder === 'undefined') {
        failVideoSession('recorder-unsupported');
        return;
      }
      cancelSession(false);
      const generation = generationRef.current;
      operationRef.current = true;
      dispatch({ type: 'transition', status: 'requesting' });
      try {
        const stream = await requestCameraStream(preferredFacing);
        if (!mountedRef.current || generation !== generationRef.current) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        setFacing(preferredFacing);
        if (liveVideoRef.current) {
          await attachCameraStream(liveVideoRef.current, stream);
        }
        dispatch({ type: 'transition', status: 'ready' });
        const count = await countVideoInputs();
        if (generation === generationRef.current) setCameraCount(count);
      } catch (error) {
        failVideoSession(classifyCameraError(error));
      } finally {
        if (generation === generationRef.current) operationRef.current = false;
      }
    },
    [cancelSession, facing, failVideoSession],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || stateRef.current.status !== 'recording') return;
    if (recorder.state !== 'recording' && recorder.state !== 'paused') return;
    stopRequestedRef.current = true;
    discardOnStopRef.current = false;
    clearRecordingTimers();
    dispatch({ type: 'transition', status: 'processing' });
    try {
      recorder.stop();
    } catch {
      failVideoSession('recording-failed');
    }
  }, [clearRecordingTimers, failVideoSession]);

  const startRecording = useCallback(() => {
    if (stateRef.current.status !== 'ready' || operationRef.current) return;
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') {
      failVideoSession('recorder-unsupported');
      return;
    }
    operationRef.current = true;
    chunksRef.current = [];
    stopRequestedRef.current = false;
    discardOnStopRef.current = false;
    const generation = generationRef.current;
    const selectedMime = selectSupportedVideoMimeType((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    try {
      const recorder = new MediaRecorder(
        stream,
        selectedMime ? { mimeType: selectedMime } : undefined,
      );
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (generation === generationRef.current && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        if (!mountedRef.current || generation !== generationRef.current) return;
        failVideoSession('recording-failed');
      };
      recorder.onstop = () => {
        recorderRef.current = null;
        operationRef.current = false;
        clearRecordingTimers();
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
        if (
          !mountedRef.current ||
          generation !== generationRef.current ||
          discardOnStopRef.current
        ) {
          chunksRef.current = [];
          return;
        }
        if (!stopRequestedRef.current) {
          failVideoSession('unexpected-stop');
          return;
        }
        const chunks = chunksRef.current;
        chunksRef.current = [];
        if (!chunks.length) {
          failVideoSession('empty-recording');
          return;
        }
        const actualMime =
          chunks.find((chunk) => chunk.type)?.type || recorder.mimeType;
        const blob = new Blob(
          chunks,
          actualMime ? { type: actualMime } : undefined,
        );
        if (!blob.size || !blob.type) {
          failVideoSession('empty-recording');
          return;
        }
        discardCapture();
        const nextCapture: LocalVideoCapture = {
          blob,
          objectUrl: URL.createObjectURL(blob),
          mimeType: blob.type,
          durationMs: Math.min(
            VIDEO_DURATION_MS,
            Math.max(0, Date.now() - recordingStartedAtRef.current),
          ),
        };
        captureRef.current = nextCapture;
        setCapture(nextCapture);
        releaseCamera();
        dispatch({ type: 'transition', status: 'captured' });
      };
      recordingStartedAtRef.current = Date.now();
      recorder.start(250);
      dispatch({ type: 'transition', status: 'recording' });
      stopTimeoutRef.current = window.setTimeout(
        stopRecording,
        VIDEO_DURATION_MS,
      );
      tickIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - recordingStartedAtRef.current;
        dispatch({
          type: 'tick',
          remainingSeconds: Math.max(
            0,
            Math.ceil((VIDEO_DURATION_MS - elapsed) / 1000),
          ),
        });
      }, 250);
    } catch {
      failVideoSession('recording-failed');
    }
  }, [
    clearRecordingTimers,
    discardCapture,
    failVideoSession,
    releaseCamera,
    stopRecording,
  ]);

  const retake = useCallback(() => {
    if (operationRef.current || stateRef.current.status === 'recording') return;
    discardCapture();
    void startCamera();
  }, [discardCapture, startCamera]);

  const acceptVideo = useCallback(() => {
    if (!captureRef.current || stateRef.current.status !== 'captured') return;
    releaseCamera();
    dispatch({ type: 'transition', status: 'accepted' });
  }, [releaseCamera]);

  const downloadVideo = useCallback(() => {
    const current = captureRef.current;
    if (!current) return;
    const anchor = document.createElement('a');
    anchor.href = current.objectUrl;
    anchor.download = safeVideoFilename(eventName, current.mimeType);
    anchor.click();
  }, [eventName]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state.status !== 'ready') return;
    const video = liveVideoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.srcObject === stream) return;
    let active = true;
    void attachCameraStream(video, stream).catch(() => {
      if (!active || !mountedRef.current) return;
      failVideoSession('recording-failed');
    });
    return () => {
      active = false;
    };
  }, [failVideoSession, state.status]);

  useEffect(() => {
    mountedRef.current = true;
    const stopOnLeave = () => {
      cancelSession(true);
      dispatch({ type: 'reset' });
    };
    const onVisibility = () => {
      if (!document.hidden) return;
      if (
        !['requesting', 'ready', 'recording', 'processing'].includes(
          stateRef.current.status,
        )
      )
        return;
      cancelSession(true);
      dispatch({ type: 'reset' });
    };
    window.addEventListener('pagehide', stopOnLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mountedRef.current = false;
      cancelSession(true);
      window.removeEventListener('pagehide', stopOnLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [cancelSession]);

  useEffect(() => {
    if (['captured', 'accepted', 'error'].includes(state.status)) {
      resultHeadingRef.current?.focus();
    }
  }, [state.status]);

  const errorCopy = state.error ? VIDEO_ERROR_COPY[state.error] : null;
  const navigationLocked = ['recording', 'processing'].includes(state.status);
  const showingCamera =
    state.status === 'ready' || state.status === 'recording';

  return (
    <div className="safe-bottom mx-auto flex min-h-svh w-full max-w-2xl flex-col bg-stone-950 px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6">
      <header className="flex items-center justify-between gap-2 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[.14em] text-amber-300">
            MODERN FRAME
          </p>
          <p className="truncate text-sm text-stone-300">{eventName}</p>
        </div>
        {navigationLocked ? (
          <span className="inline-flex min-h-11 items-center px-3 text-sm text-stone-500">
            Modes
          </span>
        ) : (
          <Link
            href={`/e/${eventSlug}/capture`}
            onClick={() => cancelSession(true)}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold"
          >
            Modes
          </Link>
        )}
      </header>

      {state.status === 'idle' ? (
        <section className="my-auto py-10 text-center">
          <p className="text-sm font-medium text-amber-300">Video Booth</p>
          <h1 className="display mt-3 text-4xl font-semibold">
            Ready for your video?
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-stone-300">
            Record an {VIDEO_DURATION_SECONDS}-second video. It stays on this
            device, and microphone access is never requested.
          </p>
          <button
            type="button"
            onClick={() => void startCamera()}
            className="mt-8 min-h-14 rounded-xl bg-white px-7 font-bold text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          >
            Start camera
          </button>
        </section>
      ) : null}

      {state.status === 'requesting' ? (
        <section className="my-auto text-center" role="status">
          <h1 className="display text-3xl">Opening camera…</h1>
          <p className="mt-3 text-stone-300">
            Your browser may ask for camera permission only.
          </p>
        </section>
      ) : null}

      {errorCopy ? (
        <section className="my-auto text-center" role="alert">
          <h1 ref={resultHeadingRef} tabIndex={-1} className="display text-3xl">
            {errorCopy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-stone-300">
            {errorCopy.detail}
          </p>
          <button
            type="button"
            onClick={() => void startCamera()}
            className="mt-7 min-h-12 rounded-xl bg-white px-6 font-bold text-stone-950"
          >
            Try again
          </button>
        </section>
      ) : null}

      {showingCamera ? (
        <section className="flex min-h-0 flex-1 flex-col py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-semibold">Video Booth</p>
            <p
              className={
                state.status === 'recording'
                  ? 'font-semibold text-red-300'
                  : 'text-sm text-stone-300'
              }
              role="status"
              aria-atomic="true"
            >
              {state.status === 'recording'
                ? `Recording · ${state.remainingSeconds}s remaining`
                : 'Camera ready'}
            </p>
          </div>
          <div className="relative mx-auto aspect-[3/4] max-h-[calc(100svh-13rem)] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-black">
            <video
              ref={liveVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              aria-label="Live video camera preview"
            />
            {state.status === 'recording' ? (
              <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-sm font-bold">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-red-400"
                  aria-hidden="true"
                />
                Recording
              </div>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                void startCamera(
                  facing === 'environment' ? 'user' : 'environment',
                )
              }
              disabled={state.status !== 'ready' || cameraCount < 2}
              className="min-h-12 rounded-xl border border-white/25 px-4 font-semibold disabled:opacity-40"
            >
              Switch camera
            </button>
            {state.status === 'ready' ? (
              <button
                type="button"
                aria-label={`Record an ${VIDEO_DURATION_SECONDS}-second video`}
                onClick={startRecording}
                className="min-h-12 rounded-xl bg-white px-5 font-bold text-stone-950"
              >
                Record
              </button>
            ) : (
              <button
                type="button"
                aria-label="Stop video recording"
                onClick={stopRecording}
                className="min-h-12 rounded-xl bg-red-400 px-5 font-bold text-stone-950"
              >
                Stop
              </button>
            )}
          </div>
        </section>
      ) : null}

      {state.status === 'processing' ? (
        <section className="my-auto text-center" role="status">
          <h1 className="display text-3xl">Preparing your video…</h1>
          <p className="mt-3 text-stone-300">This stays on your device.</p>
        </section>
      ) : null}

      {capture &&
      (state.status === 'captured' || state.status === 'accepted') ? (
        <section className="flex min-h-0 flex-1 flex-col py-4">
          <div className="text-center">
            <p className="text-sm font-medium text-amber-300">
              {state.status === 'accepted' ? 'Video ready' : 'Your video'}
            </p>
            <h1
              ref={resultHeadingRef}
              tabIndex={-1}
              className="display mt-1 text-3xl"
            >
              {state.status === 'accepted'
                ? 'Keep this memory.'
                : 'How does it look?'}
            </h1>
          </div>
          <video
            src={capture.objectUrl}
            controls
            playsInline
            preload="metadata"
            className="mx-auto mt-5 aspect-[3/4] max-h-[calc(100svh-16rem)] min-h-0 w-full flex-1 rounded-2xl bg-black object-contain"
            aria-label="Recorded video preview"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={retake}
              className="min-h-12 rounded-xl border border-white/25 px-5 font-semibold"
            >
              Retake
            </button>
            {state.status === 'captured' ? (
              <button
                type="button"
                onClick={acceptVideo}
                className="min-h-12 rounded-xl bg-white px-5 font-bold text-stone-950"
              >
                Use Video
              </button>
            ) : (
              <button
                type="button"
                onClick={downloadVideo}
                className="min-h-12 rounded-xl bg-white px-5 font-bold text-stone-950"
              >
                Download Video
              </button>
            )}
          </div>
          {state.status === 'accepted' ? (
            <Link
              href={`/e/${eventSlug}/capture`}
              onClick={() => cancelSession(true)}
              className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 font-semibold"
            >
              Back to Capture Modes
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
