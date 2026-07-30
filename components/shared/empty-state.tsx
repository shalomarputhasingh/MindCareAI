import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  /** What isn't here yet, stated plainly. */
  title: string;
  /** What to do about it. */
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** An empty screen is an invitation to act, so it always offers the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-brand-muted text-brand-strong flex size-12 items-center justify-center rounded-full"
      >
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="type-heading">{title}</p>
        {description ? (
          <p className="type-caption mx-auto max-w-sm text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
