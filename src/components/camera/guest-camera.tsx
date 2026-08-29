'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  CAMERA_ERROR_COPY,
  cameraReducer,
  classifyCameraError,
  stopMediaStream,
} from '@/features/camera/helpers';
import {
  attachCameraStream,
  countVideoInputs,
  createLocalCaptureFromVideo,
  requestCameraStream,
} from '@/features/camera/browser';
import type { LocalCapture } from '@/features/camera/types';
import { FrameComposer } from '@/components/frames/frame-composer';

const INITIAL_STATE = { status: 'idle', countdown: null, error: null } as const;

export function GuestCamera({
  eventName,
  eventSlug,
}: {
  eventName: string;
  eventSlug: string;
}) {
  const [state, dispatch] = useReducer(cameraReducer, INITIAL_STATE);
  const [capture, setCapture] = useState<LocalCapture | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraCount, setCameraCount] = useState(1);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const operationRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const requestVersionRef = useRef(0);
  const stateRef = useRef(state);
  const mountedRef = useRef(true);
  const statusRef = useRef<HTMLHeadingElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const releaseCamera = useCallback(() => {
    requestVersionRef.current += 1;
    operationRef.current = false;
    clearTimer();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [clearTimer]);

  const discardCapture = useCallback(() => {
    setCapture((current) => {
      if (current) URL.revokeObjectURL(current.objectUrl);
      return null;
    });
  }, []);

  const startCamera = useCallback(
    async (preferredFacing: 'environment' | 'user' = facing) => {
      if (operationRef.current) return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        dispatch({ type: 'transition', status: 'error', error: 'unsupported' });
        return;
      }
      releaseCamera();
      const requestVersion = requestVersionRef.current;
      operationRef.current = true;
      dispatch({ type: 'transition', status: 'requesting' });
      try {
        const stream = await requestCameraStream(preferredFacing);
        if (
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        setFacing(preferredFacing);
        if (videoRef.current) {
          await attachCameraStream(videoRef.current, stream);
        }
        dispatch({ type: 'transition', status: 'ready' });
        const count = await countVideoInputs();
        if (requestVersion === requestVersionRef.current) {
          setCameraCount(count);
        }
      } catch (error) {
        releaseCamera();
        dispatch({
          type: 'transition',
          status: 'error',
          error: classifyCameraError(error),
        });
      } finally {
        if (requestVersion === requestVersionRef.current) {
          operationRef.current = false;
        }
      }
    },
    [facing, releaseCamera],
  );

  const failCapture = useCallback(() => {
    releaseCamera();
    dispatch({
      type: 'transition',
      status: 'error',
      error: 'capture-failed',
    });
  }, [releaseCamera]);

  const extractFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      failCapture();
      return;
    }
    const captureVersion = requestVersionRef.current;
    try {
      const nextCapture = await createLocalCaptureFromVideo(video);
      if (!mountedRef.current || captureVersion !== requestVersionRef.current) {
        URL.revokeObjectURL(nextCapture.objectUrl);
        return;
      }
      discardCapture();
      setCapture(nextCapture);
      setFlash(true);
      flashTimerRef.current = window.setTimeout(
        () => mountedRef.current && setFlash(false),
        150,
      );
      releaseCamera();
      dispatch({ type: 'transition', status: 'captured' });
    } catch {
      failCapture();
    }
  }, [discardCapture, failCapture, releaseCamera]);

  const beginCountdown = useCallback(() => {
    if (state.status !== 'ready') return;
    dispatch({ type: 'transition', status: 'countdown' });
    let value = 3;
    const tick = () => {
      if (!mountedRef.current) return;
      value -= 1;
      if (value > 0) {
        dispatch({ type: 'countdown', value });
        timerRef.current = window.setTimeout(tick, 1000);
      } else {
        timerRef.current = null;
        void extractFrame();
      }
    };
    timerRef.current = window.setTimeout(tick, 1000);
  }, [extractFrame, state.status]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    const stopOnLeave = () => releaseCamera();
    window.addEventListener('pagehide', stopOnLeave);
    const onVisibility = () => {
      if (!document.hidden) return;
      releaseCamera();
      if (
        stateRef.current.status === 'requesting' ||
        stateRef.current.status === 'ready' ||
        stateRef.current.status === 'countdown'
      ) {
        dispatch({ type: 'transition', status: 'idle' });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mountedRef.current = false;
      releaseCamera();
      if (flashTimerRef.current !== null)
        window.clearTimeout(flashTimerRef.current);
      discardCapture();
      window.removeEventListener('pagehide', stopOnLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [discardCapture, releaseCamera]);

  useEffect(() => {
    if (
      state.status === 'captured' ||
      state.status === 'frame-select' ||
      state.status === 'error'
    ) {
      statusRef.current?.focus();
    }
  }, [state.status]);

  const errorCopy = state.error ? CAMERA_ERROR_COPY[state.error] : null;
  const showingPhoto = capture && state.status === 'captured';

  return (
    <div className="safe-bottom mx-auto flex min-h-svh w-full max-w-2xl flex-col bg-stone-950 px-4 pt-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6">
      <header className="flex items-center justify-between gap-2 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-[.14em] text-amber-300">
            MODERN FRAME
          </p>
          <p className="truncate text-sm text-stone-300">{eventName}</p>
        </div>
        <Link
          href={`/e/${eventSlug}/capture`}
          onClick={releaseCamera}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-stone-200"
        >
          Modes
        </Link>
        <Link
          href={`/e/${eventSlug}`}
          onClick={releaseCamera}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-stone-200"
        >
          Event
        </Link>
      </header>

      {state.status === 'idle' ? (
        <section className="my-auto py-12 text-center">
          <p className="text-sm font-medium text-amber-300">Photo camera</p>
          <h1 className="display mx-auto mt-3 max-w-md text-4xl font-semibold">
            Ready to capture the moment?
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-stone-300">
            Modern Frame needs camera access only while this screen is open.
            Microphone access is never requested.
          </p>
          <button
            onClick={() => startCamera()}
            className="mt-8 min-h-14 rounded-xl bg-white px-7 font-bold text-stone-950"
          >
            Start camera
          </button>
        </section>
      ) : null}

      {state.status === 'requesting' ? (
        <section className="my-auto text-center" role="status">
          <h1 className="display text-3xl">Opening camera…</h1>
          <p className="mt-3 text-stone-400">
            Your browser may ask for permission.
          </p>
        </section>
      ) : null}

      {errorCopy ? (
        <section className="my-auto text-center" role="alert">
          <h1 ref={statusRef} tabIndex={-1} className="display text-3xl">
            {errorCopy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-stone-300">
            {errorCopy.detail}
          </p>
          <button
            onClick={() => startCamera()}
            className="mt-7 min-h-12 rounded-xl bg-white px-6 font-bold text-stone-950"
          >
            Try again
          </button>
        </section>
      ) : null}

      {state.status === 'ready' || state.status === 'countdown' ? (
        <section className="flex min-h-0 flex-1 flex-col py-3">
          <div className="relative mx-auto aspect-[3/4] max-h-[calc(100svh-11rem)] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              aria-label="Live camera preview"
            />
            {state.status === 'countdown' ? (
              <div
                className="absolute inset-0 grid place-items-center bg-black/20"
                aria-hidden="true"
              >
                <span className="display text-8xl font-semibold drop-shadow-lg">
                  {state.countdown}
                </span>
              </div>
            ) : null}
            {flash ? (
              <div className="absolute inset-0 bg-white" aria-hidden="true" />
            ) : null}
          </div>
          <p className="sr-only" aria-live="polite">
            {state.status === 'countdown'
              ? 'Countdown started'
              : 'Camera ready'}
          </p>
          <div className="flex items-center justify-center gap-5 pt-4">
            <button
              type="button"
              onClick={() =>
                startCamera(facing === 'environment' ? 'user' : 'environment')
              }
              disabled={state.status !== 'ready' || cameraCount < 2}
              className="min-h-12 min-w-28 rounded-xl border border-white/25 px-4 text-sm font-semibold disabled:opacity-40"
            >
              Switch camera
            </button>
            <button
              type="button"
              onClick={beginCountdown}
              disabled={state.status !== 'ready'}
              aria-label="Take photo with three-second countdown"
              className="grid size-16 place-items-center rounded-full border-4 border-white bg-white/20 disabled:opacity-50"
            >
              <span
                className="size-11 rounded-full bg-white"
                aria-hidden="true"
              />
            </button>
          </div>
        </section>
      ) : null}

      {showingPhoto ? (
        <section className="flex min-h-0 flex-1 flex-col py-3">
          <h1 ref={statusRef} tabIndex={-1} className="sr-only">
            Photo captured
          </h1>
          <div className="relative mx-auto aspect-[3/4] max-h-[calc(100svh-11rem)] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-black">
            <Image
              src={capture.objectUrl}
              alt="Your captured photo"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => {
                discardCapture();
                void startCamera();
              }}
              className="min-h-12 flex-1 rounded-xl border border-white/25 px-5 font-semibold"
            >
              Retake
            </button>
            <button
              onClick={() =>
                dispatch({ type: 'transition', status: 'frame-select' })
              }
              className="min-h-12 flex-1 rounded-xl bg-white px-5 font-bold text-stone-950"
            >
              Use photo
            </button>
          </div>
        </section>
      ) : null}

      {capture && state.status === 'frame-select' ? (
        <FrameComposer
          capture={capture}
          eventName={eventName}
          eventSlug={eventSlug}
          onRetake={() => {
            discardCapture();
            void startCamera();
          }}
        />
      ) : null}
    </div>
  );
}
