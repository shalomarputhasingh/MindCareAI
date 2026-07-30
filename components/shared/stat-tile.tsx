import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const tones = {
  /** Neutral figures — counts, totals. */
  neutral: "bg-muted text-muted-foreground",
  /** Actions the user took. */
  primary: "bg-primary/10 text-primary-strong",
  /** The user's own progress — streaks, completion. */
  brand: "bg-brand-muted text-brand-strong",
} as const;

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Secondary line under the value, e.g. "3 of 5 done". */
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
  className?: string;
}

/** A single figure in the daily report and home summary. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "bg-card border-border shadow-soft flex flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="type-caption text-xs font-medium">{label}</p>
        {Icon ? (
          <span
            aria-hidden
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              tones[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="space-y-0.5">
        <p className="tabular text-2xl leading-none font-semibold">{value}</p>
        {hint ? <p className="type-caption text-xs">{hint}</p> : null}
      </div>
    </div>
  );
}
