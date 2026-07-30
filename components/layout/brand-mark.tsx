import { cn } from "@/lib/utils";

/**
 * The wordmark: a small breathing ring beside the name. The ring is the same
 * indigo-to-teal pair used everywhere else, drawn as a conic sweep.
 */
export function BrandMark({
  className,
  showName = true,
}: {
  className?: string;
  showName?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="relative flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{
          background:
            "conic-gradient(from 210deg, var(--primary), var(--brand), var(--primary))",
        }}
      >
        <span className="bg-card size-3.5 rounded-full" />
      </span>
      {showName ? (
        <span className="font-display text-[1.0625rem] font-semibold tracking-tight">
          MindCareAI
        </span>
      ) : null}
    </span>
  );
}
