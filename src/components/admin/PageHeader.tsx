import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Right-aligned actions (buttons, links). */
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-3">{children}</div> : null}
    </div>
  );
}
