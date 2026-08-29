'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MediaCaptureMode } from '@/types/database';

type SaveStage =
  'idle' | 'preparing' | 'uploading' | 'finishing' | 'saved' | 'error';

const LABELS: Record<SaveStage, string> = {
  idle: 'Save to event',
  preparing: 'Preparing…',
  uploading: 'Uploading…',
  finishing: 'Finishing…',
  saved: 'Saved',
  error: 'Try again',
};

export function SaveToEvent({
  eventSlug,
  blob,
  width,
  height,
  captureMode,
  templateId,
}: {
  eventSlug: string;
  blob: Blob;
  width: number;
  height: number;
  captureMode: MediaCaptureMode;
  templateId: string;
}) {
  const [stage, setStage] = useState<SaveStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const busy = ['preparing', 'uploading', 'finishing'].includes(stage);

  const save = async () => {
    if (busyRef.current || stage === 'saved') return;
    busyRef.current = true;
    setError(null);
    setStage('preparing');
    try {
      const intentResponse = await fetch(
        `/e/${eventSlug}/media/upload-intent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            byteSize: blob.size,
            width,
            height,
            captureMode,
            templateId,
            mimeType: 'image/jpeg',
          }),
        },
      );
      if (!intentResponse.ok) throw new Error('INTENT_FAILED');
      const intent = (await intentResponse.json()) as {
        mediaId: string;
        upload: { path: string; token: string };
      };
      setStage('uploading');
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('event-media')
        .uploadToSignedUrl(intent.upload.path, intent.upload.token, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      if (uploadError) throw uploadError;
      setStage('finishing');
      const finalizeResponse = await fetch(`/e/${eventSlug}/media/finalize`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mediaId: intent.mediaId }),
      });
      if (!finalizeResponse.ok) throw new Error('FINALIZE_FAILED');
      setStage('saved');
    } catch {
      setError(
        'Your download still works. Check your connection and try saving again.',
      );
      setStage('error');
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <div className="col-span-2 grid gap-2">
      <button
        type="button"
        onClick={() => void save()}
        disabled={busy || stage === 'saved'}
        className="min-h-12 rounded-xl border border-amber-300 bg-amber-300/10 px-5 font-bold text-amber-100 disabled:opacity-60"
      >
        {LABELS[stage]}
      </button>
      <div className="min-h-5 text-center text-sm" aria-live="polite">
        {stage === 'saved' ? (
          <Link
            href={`/e/${eventSlug}/gallery`}
            className="font-semibold text-amber-200 underline underline-offset-4"
          >
            View gallery
          </Link>
        ) : error ? (
          <p role="alert" className="text-red-200">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
