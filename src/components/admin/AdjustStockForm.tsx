"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { StockReason } from "@prisma/client";
import { adjustStockAction, type AdjustState } from "@/app/admin/inventory/actions";

const initialState: AdjustState = { error: null, success: null };

const REASONS: { value: StockReason; label: string }[] = [
  { value: "RESTOCK", label: "Restock" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "RETURN", label: "Return" },
  { value: "INITIAL", label: "Initial" },
  { value: "SALE", label: "Sale" },
];

function ApplyButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn bg-kava-500 px-4 py-2 text-sm text-white shadow-soft hover:bg-kava-600 disabled:opacity-60"
    >
      {pending ? "…" : "Apply"}
    </button>
  );
}

export default function AdjustStockForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(adjustStockAction, initialState);
  const deltaRef = useRef<HTMLInputElement>(null);

  function preset(value: number) {
    if (deltaRef.current) deltaRef.current.value = String(value);
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={deltaRef}
          name="delta"
          type="number"
          step="1"
          required
          placeholder="±qty"
          aria-label="Quantity change"
          className="field no-spin w-24 px-3 py-2 text-sm"
        />
        <select
          name="reason"
          defaultValue="RESTOCK"
          aria-label="Reason"
          className="field w-32 px-3 py-2 text-sm"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          name="note"
          type="text"
          placeholder="Note (optional)"
          aria-label="Note"
          className="field min-w-[8rem] flex-1 px-3 py-2 text-sm"
        />
        <ApplyButton />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {[12, 24, 48].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => preset(n)}
            className="rounded-full bg-kava-50 px-2.5 py-0.5 text-xs font-semibold text-kava-700 transition hover:bg-kava-100"
          >
            +{n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => preset(-1)}
          className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-semibold text-coral transition hover:bg-coral/20"
        >
          −1
        </button>
        {state.error ? (
          <span className="text-xs font-medium text-coral">{state.error}</span>
        ) : null}
        {state.success ? (
          <span className="text-xs font-medium text-kava-600">{state.success}</span>
        ) : null}
      </div>
    </form>
  );
}
