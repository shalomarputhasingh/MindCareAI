import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  /** 1-based index of the active step. */
  current: number;
  className?: string;
}

/** Horizontal step indicator for the setup wizard. */
export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <ol className={cn("flex items-start", className)}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const state =
          stepNumber < current ? "done" : stepNumber === current ? "current" : "upcoming";

        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex flex-1 flex-col items-center gap-2 last:flex-none"
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary text-primary-strong",
                  state === "upcoming" && "border-border text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-4" /> : stepNumber}
              </span>
              {stepNumber < steps.length ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1.5 h-px flex-1",
                    state === "done" ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "type-caption text-center text-xs",
                state === "current" && "text-foreground font-medium",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
