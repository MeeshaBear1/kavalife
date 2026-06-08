import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) {
  const full = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < full ? "text-sunny" : "text-sand"}>
            ★
          </span>
        ))}
      </div>
      <span className="text-xs font-medium text-ink/60">
        {rating.toFixed(1)}
        {reviewCount ? ` (${reviewCount})` : ""}
      </span>
    </div>
  );
}
