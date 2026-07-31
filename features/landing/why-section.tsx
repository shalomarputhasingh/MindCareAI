import { EyeOff, HardDrive, KeyRound, UserX, type LucideIcon } from "lucide-react";

import { Container } from "@/components/shared/container";

interface Point {
  icon: LucideIcon;
  title: string;
  description: string;
}

const POINTS: Point[] = [
  {
    icon: UserX,
    title: "No account",
    description: "No sign-up screen, no email, no password to lose. Open the app and start.",
  },
  {
    icon: HardDrive,
    title: "No cloud",
    description:
      "Entries are saved to a file on this computer. There's no MindCareAI server collecting them.",
  },
  {
    icon: EyeOff,
    title: "No one reads it",
    description: "Not us, either. MindCareAI runs locally, so what you write never reaches us.",
  },
  {
    icon: KeyRound,
    title: "Your own AI key",
    description:
      "Bring a key from OpenRouter, Groq or Gemini. Chat messages — and dictation, if you switch that on — go straight from your device to that provider, using your key.",
  },
];

/** The emotional core of the page: privacy, made concrete rather than promised. */
export function WhySection() {
  return (
    <section id="why" className="bg-brand-muted/40 border-border border-y py-20 sm:py-28">
      <Container
        width="wide"
        className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16"
      >
        <div className="space-y-4">
          <p className="type-eyebrow">Why MindCareAI</p>
          <h2 className="type-title text-balance">Everything stays exactly where you typed it.</h2>
          <p className="type-body text-muted-foreground text-pretty">
            Most wellbeing apps ask you to trust a company with your lowest moments.
            MindCareAI doesn&apos;t ask, because there&apos;s nothing here for it to hold.
            Your writing lives on your own machine, full stop.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((point) => (
            <div
              key={point.title}
              className="bg-card border-border shadow-soft space-y-2 rounded-xl border p-5"
            >
              <span
                aria-hidden
                className="bg-brand-muted text-brand-strong flex size-9 items-center justify-center rounded-full"
              >
                <point.icon className="size-4" />
              </span>
              <h3 className="type-heading text-sm">{point.title}</h3>
              <p className="type-caption text-pretty">{point.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
