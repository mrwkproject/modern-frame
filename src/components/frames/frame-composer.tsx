'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocalCapture } from '@/features/camera/types';
import { createPhotoFilename } from '@/features/frames/helpers';
import { renderFrameComposition } from '@/features/frames/renderer';
import {
  DEFAULT_FRAME_TEMPLATE,
  SYSTEM_FRAME_TEMPLATES,
} from '@/features/frames/templates';
import type { FrameTemplate, LocalComposition } from '@/features/frames/types';
import { SaveToEvent } from '@/components/media/save-to-event';

type ComposerStage = 'select' | 'composing' | 'composed';

function TemplateThumbnail({ template }: { template: FrameTemplate }) {
  const slot = template.photoSlots[0]!;
  return (
    <span
      className="relative block aspect-[3/4] w-full overflow-hidden rounded-md"
      style={{ backgroundColor: template.background.color }}
      aria-hidden="true"
    >
      <span
        className="absolute bg-stone-400"
        style={{
          left: `${(slot.x / template.canvas.width) * 100}%`,
          top: `${(slot.y / template.canvas.height) * 100}%`,
          width: `${(slot.width / template.canvas.width) * 100}%`,
          height: `${(slot.height / template.canvas.height) * 100}%`,
        }}
      />
    </span>
  );
}

export function FrameComposer({
  capture,
  eventName,
  eventSlug,
  onRetake,
}: {
  capture: LocalCapture;
  eventName: string;
  eventSlug: string;
  onRetake: () => void;
}) {
  const [selectedId, setSelectedId] = useState(DEFAULT_FRAME_TEMPLATE.id);
  const [preview, setPreview] = useState<LocalComposition | null>(null);
  const [composition, setComposition] = useState<LocalComposition | null>(null);
  const [stage, setStage] = useState<ComposerStage>('select');
  const [previewRevision, setPreviewRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<LocalComposition | null>(null);
  const compositionRef = useRef<LocalComposition | null>(null);
  const operationRef = useRef(false);
  const compositionVersionRef = useRef(0);
  const mountedRef = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedTemplate =
    SYSTEM_FRAME_TEMPLATES.find((template) => template.id === selectedId) ??
    DEFAULT_FRAME_TEMPLATE;

  const replacePreview = useCallback((next: LocalComposition | null) => {
    setPreview((current) => {
      if (current && current.objectUrl !== next?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }
      return next;
    });
    previewRef.current = next;
  }, []);

  const replaceComposition = useCallback((next: LocalComposition | null) => {
    setComposition((current) => {
      if (current && current.objectUrl !== next?.objectUrl) {
        URL.revokeObjectURL(current.objectUrl);
      }
      return next;
    });
    compositionRef.current = next;
  }, []);

  useEffect(() => {
    let active = true;
    void renderFrameComposition({
      captures: [capture],
      template: selectedTemplate,
      content: { eventName },
      options: { outputWidth: 360, quality: 0.82 },
    })
      .then((result) => {
        if (!active) {
          URL.revokeObjectURL(result.objectUrl);
          return;
        }
        replacePreview(result);
      })
      .catch(() => {
        if (active) {
          replacePreview(null);
          setError("We couldn't prepare this frame. Choose it again to retry.");
        }
      });
    return () => {
      active = false;
    };
  }, [capture, eventName, previewRevision, replacePreview, selectedTemplate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      compositionVersionRef.current += 1;
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current.objectUrl);
      }
      if (compositionRef.current) {
        URL.revokeObjectURL(compositionRef.current.objectUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (stage === 'composed') headingRef.current?.focus();
  }, [stage]);

  const createComposition = async () => {
    if (operationRef.current || !preview) return;
    operationRef.current = true;
    const operationVersion = ++compositionVersionRef.current;
    setError(null);
    setStage('composing');
    try {
      const result = await renderFrameComposition({
        captures: [capture],
        template: selectedTemplate,
        content: { eventName },
      });
      if (
        !mountedRef.current ||
        operationVersion !== compositionVersionRef.current
      ) {
        URL.revokeObjectURL(result.objectUrl);
        return;
      }
      replacePreview(null);
      replaceComposition(result);
      setStage('composed');
    } catch {
      setError("We couldn't finish your framed photo. Please try again.");
      setStage('select');
    } finally {
      operationRef.current = false;
    }
  };

  const retake = () => {
    compositionVersionRef.current += 1;
    operationRef.current = false;
    replacePreview(null);
    replaceComposition(null);
    onRetake();
  };

  if (stage === 'composed' && composition) {
    return (
      <section className="flex min-h-0 flex-1 flex-col py-3">
        <div className="mb-4 text-center" aria-live="polite">
          <h1 ref={headingRef} tabIndex={-1} className="display text-3xl">
            Your framed photo is ready.
          </h1>
          <p className="mt-2 text-sm text-stone-300">
            Saved only on this device when you download it.
          </p>
        </div>
        <div className="relative mx-auto aspect-[3/4] max-h-[58svh] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-black">
          <Image
            src={composition.objectUrl}
            alt={`Your photo in the ${selectedTemplate.name} frame`}
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
            Change frame
          </button>
          <button
            type="button"
            onClick={retake}
            className="min-h-12 rounded-xl border border-white/30 px-4 font-semibold"
          >
            Retake
          </button>
          <a
            href={composition.objectUrl}
            download={createPhotoFilename(eventName, selectedTemplate.id)}
            className="col-span-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-bold text-stone-950"
          >
            Download photo
          </a>
          <SaveToEvent
            eventSlug={eventSlug}
            blob={composition.blob}
            width={composition.width}
            height={composition.height}
            captureMode="single"
            templateId={selectedTemplate.id}
          />
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
        <p className="text-sm font-medium text-amber-300">Choose a frame</p>
        <h1 className="display mt-1 text-3xl">Make it yours.</h1>
      </div>
      <div className="relative mx-auto aspect-[3/4] max-h-[48svh] min-h-0 w-full flex-1 overflow-hidden rounded-2xl bg-stone-900">
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
            className="grid h-full place-items-center px-6 text-center text-sm text-stone-300"
            role="status"
          >
            Preparing your frame…
          </div>
        )}
      </div>
      <fieldset className="mt-4">
        <legend className="sr-only">Frame style</legend>
        <div className="flex gap-3 overflow-x-auto pb-2" role="radiogroup">
          {SYSTEM_FRAME_TEMPLATES.map((template) => {
            const selected = selectedId === template.id;
            return (
              <label
                key={template.id}
                className={`min-w-32 flex-1 cursor-pointer rounded-xl border p-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-300 ${
                  selected
                    ? 'border-amber-300 bg-amber-300/10'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="frame-template"
                  value={template.id}
                  checked={selected}
                  onChange={() => {
                    replacePreview(null);
                    setSelectedId(template.id);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <TemplateThumbnail template={template} />
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
        <p className="mt-2 text-center text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={retake}
          disabled={stage === 'composing'}
          className="min-h-12 rounded-xl border border-white/30 px-5 font-semibold disabled:opacity-50"
        >
          Retake
        </button>
        <button
          type="button"
          onClick={() => void createComposition()}
          disabled={!preview || stage === 'composing'}
          className="min-h-12 rounded-xl bg-white px-5 font-bold text-stone-950 disabled:opacity-50"
        >
          {stage === 'composing' ? 'Creating…' : 'Use frame'}
        </button>
      </div>
    </section>
  );
}
