"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Submit button for a server-action <form>. Optionally guards the submit with a
 * native confirm() dialog. Shows a pending label while the action runs.
 */
export default function ConfirmSubmitButton({
  children,
  pendingLabel,
  confirm,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
        }
      }}
      className={cn(className, pending && "pointer-events-none opacity-60")}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
