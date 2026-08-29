'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  attachCameraStream,
  countVideoInputs,
  createLocalCaptureFromVideo,
  requestCameraStream,
} from '@/features/camera/browser';
import {
  CAMERA_ERROR_COPY,
  classifyCameraError,
  stopMediaStream,
} from '@/features/camera/helpers';
import type { LocalCapture } from '@/features/camera/types';
import {
  INITIAL_BOOTH_STATE,
  boothReducer,
  replaceBoothCapture,
} from '@/features/booth/state';
import { BoothFrameComposer } from '@/components/frames/booth-frame-composer';

const ACTIVE_SEQUENCE_STATES = new Set([
  'requesting',
  'ready',
  'countdown',
  'between-shots',
]);

const ACTIVE_RETAKE_STATES = new Set([
  'retake-requesting',
  'retake-ready',
  'retake-countdown',
]);

export function ThreeShotBooth({
  eventName,
  eventSlug,
}: {
  eventName: string;
  eventSlug: string;
}) {
  const [state, dispatch] = useReducer(boothReducer, INITIAL_BOOTH_STATE);
  const [captures, setCaptures] = useState<LocalCapture[]>([]);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cameraCount, setCameraCount] = useState(1);
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const requestVersionRef = useRef(0);
  const operationRef = useRef(false);
  const captureOperationRef = useRef(false);
  const mountedRef = useRef(true);
  const stateRef = useRef(state);
  const capturesRef = useRef<LocalCapture[]>([]);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const releaseCamera = useCallback(() => {
    requestVersionRef.current += 1;
    operationRef.current = false;
    captureOperationRef.current = false;
    clearTimer();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [clearTimer]);

  const discardAllCaptures = useCallback(() => {
    for (const capture of capturesRef.current) {
      URL.revokeObjectURL(capture.objectUrl);
    }
    capturesRef.current = [];
    setCaptures([]);
  }, []);

  const storeCapture = useCallback((index: number, capture: LocalCapture) => {
    const replacement = replaceBoothCapture(
      capturesRef.current,
      index,
      capture,
    );
    if (replacement.replaced) {
      URL.revokeObjectURL(replacement.replaced.objectUrl);
    }
    capturesRef.current = replacement.captures;
    setCaptures(replacement.captures);
  }, []);

  const startCamera = useCallback(
    async (
      purpose: 'sequence' | 'restart' | 'retake' | 'switch',
      retakeIndex: number | null = null,
      preferredFacing: 'environment' | 'user' = facing,
    ) => {
      if (operationRef.current) return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        dispatch({ type: 'fail', error: 'unsupported' });
        return;
      }
      releaseCamera();
      const requestVersion = requestVersionRef.current;
      operationRef.current = true;
      if (purpose === 'retake' && retakeIndex !== null) {
        dispatch({ type: 'request-retake', index: retakeIndex });
      } else if (purpose === 'restart') {
        dispatch({ type: 'restart-sequence' });
      } else if (purpose === 'switch') {
        dispatch({ type: 'switch-camera' });
      } else {
        dispatch({ type: 'request-sequence' });
      }
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
        dispatch({ type: 'camera-ready' });
        const count = await countVideoInputs();
        if (requestVersion === requestVersionRef.current) setCameraCount(count);
      } catch (error) {
        releaseCamera();
        dispatch({ type: 'fail', error: classifyCameraError(error) });
      } finally {
        if (requestVersion === requestVersionRef.current) {
          operationRef.current = false;
        }
      }
    },
    [facing, releaseCamera],
  );

  const captureShotRef = useRef<
    (index: number, retake: boolean) => Promise<void>
  >(async () => undefined);

  const scheduleCountdown = useCallback(
    (index: number, retake: boolean, announceStart = true) => {
      clearTimer();
      if (announceStart) dispatch({ type: 'start-countdown' });
      let value = 3;
      const tick = () => {
        if (!mountedRef.current) return;
        value -= 1;
        if (value > 0) {
          dispatch({ type: 'countdown', value });
          timerRef.current = window.setTimeout(tick, 1000);
          return;
        }
        timerRef.current = null;
        void captureShotRef.current(index, retake);
      };
      timerRef.current = window.setTimeout(tick, 1000);
    },
    [clearTimer],
  );

  const beginCountdown = useCallback(
    (index: number, retake: boolean) => {
      if (
        operationRef.current ||
        captureOperationRef.current ||
        timerRef.current !== null
      )
        return;
      scheduleCountdown(index, retake);
    },
    [scheduleCountdown],
  );

  const captureShot = useCallback(
    async (index: number, retake: boolean) => {
      if (captureOperationRef.current || !videoRef.current) return;
      captureOperationRef.current = true;
      const requestVersion = requestVersionRef.current;
      try {
        const capture = await createLocalCaptureFromVideo(videoRef.current);
        if (
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          URL.revokeObjectURL(capture.objectUrl);
          return;
        }
        storeCapture(index, capture);
        setFlash(true);
        if (flashTimerRef.current !== null)
          window.clearTimeout(flashTimerRef.current);
        flashTimerRef.current = window.setTimeout(
          () => mountedRef.current && setFlash(false),
          150,
        );
        if (retake) {
          releaseCamera();
          dispatch({ type: 'shot-replaced' });
          return;
        }
        dispatch({ type: 'shot-captured' });
        if (index >= 2) {
          releaseCamera();
          return;
        }
        captureOperationRef.current = false;
        timerRef.current = window.setTimeout(() => {
          dispatch({ type: 'next-shot' });
          scheduleCountdown(index + 1, false, false);
        }, 900);
      } catch {
        releaseCamera();
        dispatch({ type: 'fail', error: 'capture-failed' });
      } finally {
        if (index >= 2 || retake) captureOperationRef.current = false;
      }
    },
    [releaseCamera, scheduleCountdown, storeCapture],
  );

  useEffect(() => {
    captureShotRef.current = captureShot;
  }, [captureShot]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    const stopOnLeave = () => {
      releaseCamera();
      discardAllCaptures();
      dispatch({ type: 'reset' });
    };
    const onVisibility = () => {
      if (!document.hidden) return;
      const currentStatus = stateRef.current.status;
      if (
        !ACTIVE_SEQUENCE_STATES.has(currentStatus) &&
        !ACTIVE_RETAKE_STATES.has(currentStatus)
      )
        return;
      releaseCamera();
      if (ACTIVE_SEQUENCE_STATES.has(currentStatus)) discardAllCaptures();
      dispatch({
        type: 'cancel',
        hasCompleteSet: capturesRef.current.length === 3,
      });
    };
    window.addEventListener('pagehide', stopOnLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mountedRef.current = false;
      releaseCamera();
      if (flashTimerRef.current !== null)
        window.clearTimeout(flashTimerRef.current);
      discardAllCaptures();
      window.removeEventListener('pagehide', stopOnLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [discardAllCaptures, releaseCamera]);

  useEffect(() => {
    if (state.status === 'review') reviewHeadingRef.current?.focus();
  }, [state.status]);

  const retakeAll = () => {
    if (operationRef.current) return;
    releaseCamera();
    discardAllCaptures();
    void startCamera('restart');
  };

  const errorCopy = state.error ? CAMERA_ERROR_COPY[state.error] : null;
  const showingCamera = [
    'ready',
    'countdown',
    'between-shots',
    'retake-ready',
    'retake-countdown',
  ].includes(state.status);
  const activePhotoNumber =
    state.retakeIndex !== null ? state.retakeIndex + 1 : state.shotIndex + 1;

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
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold"
        >
          Modes
        </Link>
        <Link
          href={`/e/${eventSlug}`}
          onClick={releaseCamera}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold"
        >
          Event
        </Link>
      </header>

      {state.status === 'idle' ? (
        <section className="my-auto py-10 text-center">
          <p className="text-sm font-medium text-amber-300">
            3-Shot Photobooth
          </p>
          <h1 className="display mt-3 text-4xl font-semibold">
            Three moments, automatically.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-stone-300">
            Start the camera, get ready, and we’ll take three photos with a
            countdown between each one. No microphone is used.
          </p>
          <button
            type="button"
            onClick={() => void startCamera('sequence')}
            className="mt-8 min-h-14 rounded-xl bg-white px-7 font-bold text-stone-950"
          >
            Start camera
          </button>
        </section>
      ) : null}

      {state.status === 'requesting' || state.status === 'retake-requesting' ? (
        <section className="my-auto text-center" role="status">
          <h1 className="display text-3xl">Opening camera…</h1>
          <p className="mt-3 text-stone-300">
            Your browser may ask for permission.
          </p>
        </section>
      ) : null}

      {errorCopy ? (
        <section className="my-auto text-center" role="alert">
          <h1 className="display text-3xl">{errorCopy.title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-stone-300">
            {errorCopy.detail}
          </p>
          <button
            type="button"
            onClick={() =>
              void startCamera(
                state.retakeIndex === null ? 'sequence' : 'retake',
                state.retakeIndex,
              )
            }
            className="mt-7 min-h-12 rounded-xl bg-white px-6 font-bold text-stone-950"
          >
            Try again
          </button>
        </section>
      ) : null}

      {showingCamera ? (
        <section className="flex min-h-0 flex-1 flex-col py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-semibold">Photo {activePhotoNumber} of 3</p>
            <p className="text-sm text-stone-300">
              {state.status === 'between-shots'
                ? `${state.shotIndex} of 3 captured`
                : state.retakeIndex !== null
                  ? 'Retake'
                  : 'Get ready'}
            </p>
          </div>
          <div className="relative mx-auto aspect-[3/4] max-h-[calc(100svh-13rem)] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              aria-label="Live photobooth camera preview"
            />
            {state.status === 'countdown' ||
            state.status === 'retake-countdown' ? (
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
            {state.status === 'countdown' || state.status === 'retake-countdown'
              ? `Countdown started for photo ${activePhotoNumber} of 3`
              : state.status === 'between-shots'
                ? `Photo ${state.shotIndex} of 3 captured`
                : 'Camera ready'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                void startCamera(
                  'switch',
                  state.retakeIndex,
                  facing === 'environment' ? 'user' : 'environment',
                )
              }
              disabled={
                (state.status !== 'ready' && state.status !== 'retake-ready') ||
                cameraCount < 2
              }
              className="min-h-12 rounded-xl border border-white/25 px-4 font-semibold disabled:opacity-40"
            >
              Switch camera
            </button>
            <button
              type="button"
              onClick={() =>
                beginCountdown(
                  state.retakeIndex ?? state.shotIndex,
                  state.retakeIndex !== null,
                )
              }
              disabled={
                state.status !== 'ready' && state.status !== 'retake-ready'
              }
              className="min-h-12 rounded-xl bg-white px-5 font-bold text-stone-950 disabled:opacity-50"
            >
              {state.retakeIndex === null
                ? 'Start 3-shot booth'
                : `Retake photo ${state.retakeIndex + 1}`}
            </button>
          </div>
        </section>
      ) : null}

      {state.status === 'review' ? (
        <section className="flex flex-1 flex-col py-4">
          <div className="text-center">
            <p className="text-sm font-medium text-amber-300">Three photos</p>
            <h1
              ref={reviewHeadingRef}
              tabIndex={-1}
              className="display mt-1 text-3xl"
            >
              Keep the moments you love.
            </h1>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {captures.map((capture, index) => (
              <article key={capture.objectUrl}>
                <p className="mb-2 text-center text-sm font-semibold">
                  Photo {index + 1}
                </p>
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black">
                  <Image
                    src={capture.objectUrl}
                    alt={`Photobooth photo ${index + 1} of 3`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void startCamera('retake', index)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-white/25 px-2 text-sm font-semibold"
                >
                  Retake {index + 1}
                </button>
              </article>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={retakeAll}
              className="min-h-12 rounded-xl border border-white/25 px-5 font-semibold"
            >
              Retake all
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'choose-layout' })}
              disabled={captures.length !== 3}
              className="min-h-12 rounded-xl bg-white px-5 font-bold text-stone-950 disabled:opacity-50"
            >
              Choose layout
            </button>
          </div>
        </section>
      ) : null}

      {state.status === 'layout-select' && captures.length === 3 ? (
        <BoothFrameComposer
          captures={captures}
          eventName={eventName}
          eventSlug={eventSlug}
          onReview={() => dispatch({ type: 'back-to-review' })}
          onRetakeAll={retakeAll}
        />
      ) : null}
    </div>
  );
}
