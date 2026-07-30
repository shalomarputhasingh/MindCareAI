import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

interface DayCellProps {
  /** Accessible name and native tooltip, e.g. "30 July — Great". */
  label: string;
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md";
  /** Renders a focusable button instead of a static cell. */
  interactive?: boolean;
  onClick?: () => void;
  /** Highlights the cell as "today". */
  current?: boolean;
  /**
   * React 19 delivers `ref` as a plain prop — declared explicitly here so a
   * parent can use `interactive` cells as the child of an `asChild` trigger
   * (the mood calendar's day popovers rely on this).
   */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A single tinted day square. The building block behind the mood calendar's
 * month grid and the habit heatmap's 30-day rows — shared here (rather than
 * duplicated in both features) since it's the one visual atom both screens
 * need: a small coloured square keyed to a day, with a tooltip and an
 * optional focus/click affordance.
 */
export function DayCell({
  label,
  children,
  className,
  size = "md",
  interactive = false,
  onClick,
  current = false,
  ref,
}: DayCellProps) {
  const dimensions = size === "sm" ? "size-4 sm:size-[1.15rem]" : "size-9 sm:size-10";

  const shared = cn(
    "flex items-center justify-center rounded-md text-[11px] font-medium tabular-nums transition-colors",
    dimensions,
    current && "ring-2 ring-ring ring-offset-1 ring-offset-background",
    className,
  );

  if (interactive) {
    return (
      <button
        ref={ref}
        type="button"
        title={label}
        aria-label={label}
        onClick={onClick}
        className={cn(shared, "cursor-pointer hover:opacity-80 focus-visible:opacity-80")}
      >
        {children}
      </button>
    );
  }

  return (
    <div title={label} aria-label={label} className={shared}>
      {children}
    </div>
  );
}
