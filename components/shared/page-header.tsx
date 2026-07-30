import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  /** Small label above the title, e.g. the current date. */
  eyebrow?: string;
  description?: ReactNode;
  /** Buttons aligned to the end of the header row. */
  actions?: ReactNode;
  className?: string;
}

/** The top of every app screen. One per page. */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <p className="type-eyebrow">{eyebrow}</p> : null}
        <h1 className="type-title text-balance">{title}</h1>
        {description ? (
          <p className="type-caption max-w-prose text-pretty">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
