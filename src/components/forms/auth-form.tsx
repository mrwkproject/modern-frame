'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import type { FormState } from '@/features/auth/types';
import { initialFormState } from '@/features/auth/types';

type AuthFormProps = {
  action: (state: FormState, payload: FormData) => Promise<FormState>;
  mode: 'login' | 'register';
};

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-2 text-sm text-[var(--destructive)]">
      {errors[0]}
    </p>
  );
}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const isRegister = mode === 'register';

  useEffect(() => {
    if (state.status === 'error') errorRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      {state.message ? (
        <div
          ref={errorRef}
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

      {isRegister ? (
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.displayName)}
            aria-describedby={
              state.fieldErrors?.displayName ? 'displayName-error' : undefined
            }
            className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <FieldError
            id="displayName-error"
            errors={state.fieldErrors?.displayName}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? 'email-error' : undefined
          }
          className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <FieldError id="email-error" errors={state.fieldErrors?.email} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? 'password-error' : undefined
            }
            className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 pr-20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={pending}
            className="absolute inset-y-0 right-1 min-w-16 rounded-md px-3 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
            aria-label={`${showPassword ? 'Hide' : 'Show'} password`}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <FieldError id="password-error" errors={state.fieldErrors?.password} />
        {isRegister && !state.fieldErrors?.password ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Use at least 8 characters.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending || state.status === 'success'}
        className="min-h-12 w-full rounded-lg bg-[var(--primary)] px-5 font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? isRegister
            ? 'Creating account…'
            : 'Signing in…'
          : isRegister
            ? 'Create account'
            : 'Sign in'}
      </button>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        {isRegister ? 'Already have an account?' : 'New to Modern Frame?'}{' '}
        <Link
          className="font-semibold text-[var(--foreground)] underline underline-offset-4"
          href={isRegister ? '/login' : '/register'}
        >
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
