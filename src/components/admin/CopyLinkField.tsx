"use client";

import { useState } from "react";

/**
 * Read-only display of a Square payment link with one-click Copy, Open, and
 * "Email to customer" (mailto with the link pre-filled) — so the seller can get
 * the pay-online link to the buyer for a live order.
 */
export default function CopyLinkField({ url, email }: { url: string; email?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the field manually */
    }
  }

  const mailto = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
        "Your Kava Life payment link"
      )}&body=${encodeURIComponent(
        `Aloha,\n\nHere's a secure link to pay for your order:\n${url}\n\nMahalo! 🌺`
      )}`
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="field flex-1 font-mono text-xs"
        />
        <button
          type="button"
          onClick={copy}
          className="btn shrink-0 bg-white px-4 text-sm font-semibold text-ink/70 ring-1 ring-sand hover:bg-kava-50 hover:text-kava-700"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-white px-4 py-2 text-sm font-semibold text-ink/70 ring-1 ring-sand hover:bg-kava-50 hover:text-kava-700"
        >
          Open link ↗
        </a>
        {mailto ? (
          <a
            href={mailto}
            className="btn bg-white px-4 py-2 text-sm font-semibold text-ink/70 ring-1 ring-sand hover:bg-kava-50 hover:text-kava-700"
          >
            Email to customer
          </a>
        ) : null}
      </div>
    </div>
  );
}
