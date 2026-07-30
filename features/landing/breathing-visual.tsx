const RINGS = [
  { size: "100%", delay: "0s", tone: "border-primary/25" },
  { size: "78%", delay: "-6s", tone: "border-brand/35" },
  { size: "56%", delay: "-12s", tone: "border-primary/40" },
  { size: "34%", delay: "-3s", tone: "border-brand/55" },
] as const;

/**
 * The hero's signature visual: concentric rings breathing in and out on the
 * same 19s cycle used for ambient motion elsewhere in the product (see
 * `--animate-breathe` in globals.css). Purely decorative — the outer span
 * only positions and sizes each ring; the inner span carries the animation,
 * so the scale transform never fights the centring transform.
 */
export function BreathingVisual() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-sm">
      {RINGS.map((ring) => (
        <span
          key={ring.size}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: ring.size, height: ring.size }}
        >
          <span
            className={`animate-breathe block h-full w-full rounded-full border ${ring.tone}`}
            style={{ animationDelay: ring.delay }}
          />
        </span>
      ))}
      <span
        className="bg-brand shadow-glow absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
    </div>
  );
}
