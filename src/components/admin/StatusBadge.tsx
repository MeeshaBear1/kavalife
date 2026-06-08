import { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  PAID: {
    label: "Paid",
    className: "bg-kava-50 text-kava-700 ring-kava-200",
    dot: "bg-kava-500",
  },
  FULFILLED: {
    label: "Fulfilled",
    className: "bg-lagoon-300/20 text-lagoon-600 ring-lagoon-400/40",
    dot: "bg-lagoon-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-ink/5 text-ink/60 ring-ink/15",
    dot: "bg-ink/40",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-coral/10 text-coral ring-coral/30",
    dot: "bg-coral",
  },
};

export default function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        s.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}
