'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocalCapture } from '@/features/camera/types';
import { createPhotoFilename } from '@/features/frames/helpers';
import { renderFrameComposition } from '@/features/frames/renderer';
import {
  BOOTH_FRAME_TEMPLATES,
  DEFAULT_BOOTH_TEMPLATE,
} from '@/features/frames/templates';
import type { FrameTemplate, LocalComposition } from '@/features/frames/types';

function LayoutThumbnail({ template }: { template: FrameTemplate }) {
  return (
    <span
      className="relative block h-28 w-full overflow-hidden rounded-md"
      style={{ backgroundColor: template.background.color }}
      aria-hidden="true"
    >
      {template.photoSlots.map((slot) => (
        <span
          key={slot.id}
          className="absolute bg-stone-400"
          style={{
            left: `${(slot.x / template.canvas.width) * 100}%`,
            top: `${(slot.y / template.canvas.height) * 100}%`,
            width: `${(slot.width / template.canvas.width) * 100}%`,
            height: `${(slot.height / template.canvas.height) * 100}%`,
          }}
        />
      ))}
    </span>
  );
}

export function BoothFrameComposer({
  captures,
  eventName,
  eventSlug,
  onReview,
  onRetakeAll,
}: {
  captures: readonly LocalCapture[];
  eventName: string;
  eventSlug: string;
  onReview: () => void;
  onRetakeAll: () => void;
}) {
  const [selectedId, setSelectedId] = useState(DEFAULT_BOOTH_TEMPLATE.id);
  const [preview, setPreview] = useState<LocalComposition | null>(null);
  const [composition, setComposition] = useState<LocalComposition | null>(null);
  const [stage, setStage] = useState<'select' | 'composing' | 'composed'>(
    'select',
  );
  const [previewRevision, setPreviewRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<LocalComposition | null>(null);
  const compositionRef = useRef<LocalComposition | null>(null);
  const operationVersionRef = useRef(0);
  const operationRef = useRef(false);
  const mountedRef = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedTemplate =
    BOOTH_FRAME_TEMPLATES.find((template) => template.id === selectedId) ??
    DEFAULT_BOOTH_TEMPLATE;

  const replacePreview = useCallback((next: LocalComposition | null) => {
    if (
      previewRef.current &&
      previewRef.current.objectUrl !== next?.objectUrl
    ) {
      URL.revokeObjectURL(previewRef.current.objectUrl);
    }
    previewRef.current = next;
    setPreview(next);
  }, []);

  const replaceComposition = useCallback((next: LocalComposition | null) => {
    if (
      compositionRef.current &&
      compositionRef.current.objectUrl !== next?.objectUrl
    ) {
      URL.revokeObjectURL(compositionRef.current.objectUrl);
    }
    compositionRef.current = next;
    setComposition(next);
  }, []);

  useEffect(() => {
    let active = true;
    void renderFrameComposition({
      captures,
      template: selectedTemplate,
      content: { eventName },
      options: { outputWidth: 240, quality: 0.82 },
    })
      .then((result) => {
        if (!active) return URL.revokeObjectURL(result.objectUrl);
        replacePreview(result);
      })
      .catch(() => {
        if (active) {
          replacePreview(null);
          setError(
            "We couldn't prepare this layout. Select it again to retry.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [captures, eventName, previewRevision, replacePreview, selectedTemplate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationVersionRef.current += 1;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.objectUrl);
      if (compositionRef.current)
        URL.revokeObjectURL(compositionRef.current.objectUrl);
    };
  }, []);

  useEffect(() => {
    if (stage === 'composed') headingRef.current?.focus();
  }, [stage]);

  const compose = async () => {
    if (!preview || operationRef.current) return;
    operationRef.current = true;
    const version = ++operationVersionRef.current;
    setStage('composing');
    setError(null);
    try {
      const result = await renderFrameComposition({
        captures,
        template: selectedTemplate,
        content: { eventName },
      });
      if (!mountedRef.current || version !== operationVersionRef.current) {
        URL.revokeObjectURL(result.objectUrl);
        return;
      }
      replacePreview(null);
      replaceComposition(result);
      setStage('composed');
    } catch {
      setError("We couldn't finish your photo strip. Please try again.");
      setStage('select');
    } finally {
      operationRef.current = false;
    }
  };

  const returnToReview = () => {
    operationVersionRef.current += 1;
    replacePreview(null);
    replaceComposition(null);
    onReview();
  };

  if (stage === 'composed' && composition) {
    return (
      <section className="flex min-h-0 flex-1 flex-col py-3">
        <div className="mb-4 text-center" aria-live="polite">
          <h1 ref={headingRef} tabIndex={-1} className="display text-3xl">
            Your photo strip is ready.
          </h1>
          <p className="mt-2 text-sm text-stone-300">
            Download it to save it on this device.
          </p>
        </div>
        <div
          className="relative mx-auto max-h-[54svh] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-black"
          style={{
            aspectRatio: `${composition.width} / ${composition.height}`,
          }}
        >
          <Image
            src={composition.objectUrl}
            alt={`Your three photos in the ${selectedTemplate.name} layout`}
            fill
            unoptimized
            className="object-contain"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              replaceComposition(null);
              setStage('select');
              setPreviewRevision((current) => current + 1);
            }}
            className="min-h-12 rounded-xl border border-white/30 px-4 font-semibold"
          >
            Change layout
          </button>
          <button
            type="button"
            onClick={returnToReview}
            className="min-h-12 rounded-xl border border-white/30 px-4 font-semibold"
          >
            Retake a photo
          </button>
          <button
            type="button"
            onClick={() => {
              replaceComposition(null);
              onRetakeAll();
            }}
            className="min-h-12 rounded-xl border border-white/30 px-4 font-semibold"
          >
            Retake all
          </button>
          <a
            href={composition.objectUrl}
            download={createPhotoFilename(eventName, selectedTemplate.id)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-4 font-bold text-stone-950"
          >
            Download strip
          </a>
          <Link
            href={`/e/${eventSlug}`}
            className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-xl px-5 font-semibold text-stone-200"
          >
            Back to event
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col py-3">
      <div className="mb-3 text-center">
        <p className="text-sm font-medium text-amber-300">Choose a layout</p>
        <h1 className="display mt-1 text-3xl">Build your strip.</h1>
      </div>
      <div
        className="relative mx-auto max-h-[42svh] min-h-48 w-full flex-1 overflow-hidden rounded-2xl bg-stone-900"
        style={{
          aspectRatio: `${selectedTemplate.canvas.width} / ${selectedTemplate.canvas.height}`,
        }}
      >
        {preview ? (
          <Image
            src={preview.objectUrl}
            alt={`Preview of ${selectedTemplate.name}`}
            fill
            unoptimized
            className="object-contain"
          />
        ) : (
          <div
            className="grid h-full place-items-center text-sm text-stone-300"
            role="status"
          >
            Preparing your layout…
          </div>
        )}
      </div>
      <fieldset className="mt-4">
        <legend className="sr-only">Photo strip layout</legend>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {BOOTH_FRAME_TEMPLATES.map((template) => {
            const selected = selectedId === template.id;
            return (
              <label
                key={template.id}
                className={`min-w-32 flex-1 cursor-pointer rounded-xl border p-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-300 ${
                  selected
                    ? 'border-amber-300 bg-amber-300/10'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="booth-layout"
                  checked={selected}
                  value={template.id}
                  onChange={() => {
                    replacePreview(null);
                    setSelectedId(template.id);
                    setError(null);
                  }}
                />
                <LayoutThumbnail template={template} />
                <span className="mt-2 block text-sm font-semibold">
                  {template.name}
                </span>
                <span className="mt-1 block text-[13px] text-stone-300">
                  {selected ? 'Selected' : template.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {error ? (
        <p role="alert" className="mt-2 text-center text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={returnToReview}
          disabled={stage === 'composing'}
          className="min-h-12 rounded-xl border border-white/30 px-4 font-semibold disabled:opacity-50"
        >
          Review photos
        </button>
        <button
          type="button"
          onClick={() => void compose()}
          disabled={!preview || stage === 'composing'}
          className="min-h-12 rounded-xl bg-white px-4 font-bold text-stone-950 disabled:opacity-50"
        >
          {stage === 'composing' ? 'Creating…' : 'Use layout'}
        </button>
      </div>
    </section>
  );
}
