"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { StoreSettings } from "@/lib/settings";
import { centsToDollars } from "@/lib/money";
import { updateSettings, type SettingsState } from "@/app/admin/settings/actions";

const initialState: SettingsState = { error: null, success: false };

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink/45">{hint}</p>
      ) : null}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

export default function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction] = useActionState(updateSettings, initialState);
  const fe = state.fieldErrors ?? {};
  const taxPercent = (settings.taxRateBps / 100).toString();

  return (
    <form action={formAction} className="space-y-6">
      {state.success ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-kava-50 px-4 py-3 text-sm font-medium text-kava-700 ring-1 ring-inset ring-kava-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Settings saved.
        </p>
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral ring-1 ring-inset ring-coral/20"
        >
          {state.error}
        </p>
      ) : null}

      <div className="card-surface space-y-5 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Storefront</h2>

        <Field label="Store name" htmlFor="storeName" error={fe.storeName}>
          <input
            id="storeName"
            name="storeName"
            type="text"
            required
            defaultValue={settings.storeName}
            className="field"
          />
        </Field>

        <Field
          label="Announcement bar"
          htmlFor="announcement"
          hint="Shown across the top of the storefront. Leave blank to hide."
          error={fe.announcement}
        >
          <input
            id="announcement"
            name="announcement"
            type="text"
            defaultValue={settings.announcement ?? ""}
            placeholder="Free shipping on orders over $50"
            className="field"
          />
        </Field>

        <Field label="Support email" htmlFor="supportEmail" error={fe.supportEmail}>
          <input
            id="supportEmail"
            name="supportEmail"
            type="email"
            required
            defaultValue={settings.supportEmail}
            className="field"
          />
        </Field>
      </div>

      <div className="card-surface space-y-5 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Shipping &amp; tax</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Flat shipping (USD)"
            htmlFor="flatShipping"
            error={fe.flatShippingCents}
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40">
                $
              </span>
              <input
                id="flatShipping"
                name="flatShipping"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={centsToDollars(settings.flatShippingCents)}
                className="field no-spin pl-7"
              />
            </div>
          </Field>

          <Field
            label="Free shipping over (USD)"
            htmlFor="freeShippingThreshold"
            hint="Set 0 to disable free shipping."
            error={fe.freeShippingThresholdCents}
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/40">
                $
              </span>
              <input
                id="freeShippingThreshold"
                name="freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={centsToDollars(settings.freeShippingThresholdCents)}
                className="field no-spin pl-7"
              />
            </div>
          </Field>
        </div>

        <Field
          label="Tax rate (%)"
          htmlFor="taxRatePercent"
          hint="e.g. 8.75 for 8.75%. Set 0 for no tax."
          error={fe.taxRateBps}
        >
          <div className="relative max-w-[12rem]">
            <input
              id="taxRatePercent"
              name="taxRatePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              defaultValue={taxPercent}
              className="field no-spin pr-8"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink/40">
              %
            </span>
          </div>
        </Field>
      </div>

      <div className="card-surface space-y-1 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Currency</h2>
        <p className="text-sm text-ink/55">
          Store currency is{" "}
          <span className="font-semibold text-ink">{settings.currency.toUpperCase()}</span>.
          Currency is fixed at setup and not editable here.
        </p>
      </div>

      <div className="flex items-center justify-end border-t border-sand pt-6">
        <SaveButton />
      </div>
    </form>
  );
}
