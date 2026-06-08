import { cn } from "@/lib/utils";

const CATEGORY_GLYPH: Record<string, string> = {
  GUMMIES: "🍬",
  SHOTS: "⚡",
  SELTZERS: "🥤",
};

export function ProductImage({
  name,
  flavor,
  imageUrl,
  accentColor,
  category,
  className,
  showFlavor = true,
}: {
  name: string;
  flavor?: string | null;
  imageUrl?: string | null;
  accentColor?: string | null;
  category?: string | null;
  className?: string;
  showFlavor?: boolean;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  const accent = accentColor || "#1fa85c";
  const glyph = (category && CATEGORY_GLYPH[category]) || "🌿";

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden",
        className
      )}
      style={{
        background: `radial-gradient(130% 120% at 28% 18%, ${accent}40, ${accent}10 55%), linear-gradient(150deg, ${accent}22, #ffffff 92%)`,
      }}
    >
      <span className="text-6xl drop-shadow-sm" aria-hidden>
        {glyph}
      </span>
      {showFlavor && flavor ? (
        <span className="mt-3 max-w-[80%] text-center font-display text-sm font-semibold text-ink/70">
          {flavor}
        </span>
      ) : null}
    </div>
  );
}
