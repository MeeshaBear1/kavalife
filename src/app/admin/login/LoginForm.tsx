"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@kavalife.com"
          className="field"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="field"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-2.5 text-sm font-medium text-coral ring-1 ring-inset ring-coral/20"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
