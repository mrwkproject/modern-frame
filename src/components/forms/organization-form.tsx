'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { FormState } from '@/features/auth/types';
import { initialFormState } from '@/features/auth/types';

export function OrganizationForm({
  action,
}: {
  action: (state: FormState, payload: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'error') errorRef.current?.focus();
  }, [state]);

  const nameErrors = state.fieldErrors?.organizationName;
  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      {state.message ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {state.message}
        </div>
      ) : null}
      <div>
        <label
          htmlFor="organizationName"
          className="block text-sm font-semibold"
        >
          Workspace name
        </label>
        <input
          id="organizationName"
          name="organizationName"
          type="text"
          autoComplete="organization"
          placeholder="Modern Frame Studio"
          disabled={pending}
          aria-invalid={Boolean(nameErrors)}
          aria-describedby={
            nameErrors ? 'organizationName-error' : 'organizationName-help'
          }
          className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {nameErrors ? (
          <p
            id="organizationName-error"
            className="mt-2 text-sm text-[var(--destructive)]"
          >
            {nameErrors[0]}
          </p>
        ) : (
          <p
            id="organizationName-help"
            className="mt-2 text-sm text-[var(--muted-foreground)]"
          >
            This can be your studio, business, or personal event workspace.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-lg bg-[var(--primary)] px-5 font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Creating workspace…' : 'Create workspace'}
      </button>
    </form>
  );
}
