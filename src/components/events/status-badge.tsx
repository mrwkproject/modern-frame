import { EVENT_STATUS_LABELS } from '@/features/events/constants';
import type { EventStatus } from '@/types/database';

const tones: Record<EventStatus, string> = {
  draft: 'border-stone-300 bg-stone-100 text-stone-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ended: 'border-amber-200 bg-amber-50 text-amber-900',
  archived: 'border-stone-300 bg-stone-200 text-stone-600',
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold tracking-[0.08em] uppercase ${tones[status]}`}
    >
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}
