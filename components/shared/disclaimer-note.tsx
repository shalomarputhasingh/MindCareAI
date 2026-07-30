import { Info } from "lucide-react";

import { DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The "this is not medical care" note. It appears wherever the app could be
 * mistaken for clinical support, so the wording lives in one place and never
 * drifts between screens.
 */
export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-muted-foreground bg-muted/60 border-border flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed text-pretty",
        className,
      )}
    >
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{DISCLAIMER}</span>
    </p>
  );
}
