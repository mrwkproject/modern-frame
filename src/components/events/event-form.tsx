'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { EVENT_TYPES } from '@/features/events/constants';
import type { FormState } from '@/features/auth/types';
import { initialFormState } from '@/features/auth/types';
import type { EventType } from '@/types/database';

export type EventFormDefaults = {
  name?: string;
  eventType?: EventType;
  date?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  description?: string;
};

type EventFormProps = {
  action: (state: FormState, payload: FormData) => Promise<FormState>;
  defaults?: EventFormDefaults;
  mode: 'create' | 'edit';
};

const SUGGESTED_TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Australia/Sydney',
  'Europe/London',
  'America/New_York',
  'UTC',
];

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-2 text-sm text-[var(--destructive)]">
      {errors[0]}
    </p>
  );
}

export function EventForm({ action, defaults = {}, mode }: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [timezone, setTimezone] = useState(defaults.timezone ?? 'UTC');
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaults.timezone) return;
    const timer = window.setTimeout(() => {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaults.timezone]);

  useEffect(() => {
    if (state.status !== 'idle') messageRef.current?.focus();
  }, [state]);

  const describedBy = (field: string, help?: string) =>
    state.fieldErrors?.[field] ? `${field}-error` : help;

  return (
    <form action={formAction} className="mt-8 space-y-6" noValidate>
      {state.message ? (
        <div
          ref={messageRef}
          tabIndex={-1}
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border p-4 text-sm ${
            state.status === 'error'
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold">
          Event name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          defaultValue={defaults.name}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={describedBy('name')}
          className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 disabled:opacity-60"
        />
        <FieldError id="name-error" errors={state.fieldErrors?.name} />
      </div>

      <div>
        <label htmlFor="eventType" className="block text-sm font-semibold">
          Event type
        </label>
        <select
          id="eventType"
          name="eventType"
          defaultValue={defaults.eventType ?? 'wedding'}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.eventType)}
          aria-describedby={describedBy('eventType')}
          className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 disabled:opacity-60"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <FieldError
          id="eventType-error"
          errors={state.fieldErrors?.eventType}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Event schedule</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={defaults.date}
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.date)}
              aria-describedby={describedBy('date')}
              className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-3 disabled:opacity-60"
            />
            <FieldError id="date-error" errors={state.fieldErrors?.date} />
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium">
              Start
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              defaultValue={defaults.startTime ?? '18:00'}
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.startTime)}
              aria-describedby={describedBy('startTime')}
              className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-3 disabled:opacity-60"
            />
            <FieldError
              id="startTime-error"
              errors={state.fieldErrors?.startTime}
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium">
              End
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              defaultValue={defaults.endTime ?? '22:00'}
              disabled={pending}
              aria-invalid={Boolean(state.fieldErrors?.endTime)}
              aria-describedby={describedBy('endTime')}
              className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-3 disabled:opacity-60"
            />
            <FieldError
              id="endTime-error"
              errors={state.fieldErrors?.endTime}
            />
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="timezone" className="block text-sm font-semibold">
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          list="timezone-options"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.timezone)}
          aria-describedby={describedBy('timezone', 'timezone-help')}
          className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 disabled:opacity-60"
        />
        <datalist id="timezone-options">
          {SUGGESTED_TIMEZONES.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <FieldError id="timezone-error" errors={state.fieldErrors?.timezone} />
        {!state.fieldErrors?.timezone ? (
          <p
            id="timezone-help"
            className="mt-2 text-sm text-[var(--muted-foreground)]"
          >
            Use an IANA timezone such as Asia/Jakarta.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold">
          Description <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults.description}
          disabled={pending}
          maxLength={1000}
          aria-invalid={Boolean(state.fieldErrors?.description)}
          aria-describedby={describedBy('description', 'description-help')}
          className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-white px-4 py-3 disabled:opacity-60"
        />
        <FieldError
          id="description-error"
          errors={state.fieldErrors?.description}
        />
        {!state.fieldErrors?.description ? (
          <p
            id="description-help"
            className="mt-2 text-sm text-[var(--muted-foreground)]"
          >
            A short welcome shown on the public event page.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-lg bg-[var(--primary)] px-5 font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {pending
          ? mode === 'create'
            ? 'Creating event…'
            : 'Saving changes…'
          : mode === 'create'
            ? 'Create event'
            : 'Save settings'}
      </button>
    </form>
  );
}
