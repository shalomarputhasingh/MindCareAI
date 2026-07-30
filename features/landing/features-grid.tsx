import {
  ChartNoAxesColumn,
  LifeBuoy,
  ListChecks,
  MessageCircleHeart,
  NotebookPen,
  SmilePlus,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "primary" | "brand" | "neutral";
}

/**
 * Icons and labels mirror `components/layout/nav-config.ts` exactly, so the
 * promise made here matches what's actually in the sidebar.
 */
const FEATURES: Feature[] = [
  {
    icon: MessageCircleHeart,
    title: "AI Chat",
    description:
      "Talk something through with an AI that listens, asks good questions, and never rushes you to a conclusion.",
    tone: "primary",
  },
  {
    icon: SmilePlus,
    title: "Mood Tracker",
    description: "One check-in a day. Watch your mood become a pattern, not a verdict.",
    tone: "brand",
  },
  {
    icon: NotebookPen,
    title: "Daily Journal",
    description: "Write freely. No prompts to answer, no streak to protect, no one grading it.",
    tone: "brand",
  },
  {
    icon: ListChecks,
    title: "Healthy Habits",
    description: "Small, repeatable things — water, sleep, movement — tracked without guilt.",
    tone: "brand",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Daily Report",
    description:
      "A short, plain-language summary of how the day went, built from what you already logged.",
    tone: "brand",
  },
  {
    icon: LifeBuoy,
    title: "Emergency Support",
    description:
      "Helpline directories for your country and grounding techniques, always one tap away — never routed through the AI.",
    tone: "neutral",
  },
];

const TONES = {
  primary: "bg-primary/10 text-primary-strong",
  brand: "bg-brand-muted text-brand-strong",
  neutral: "bg-muted text-foreground",
} as const;

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container width="wide" className="space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="type-eyebrow">What&apos;s inside</p>
          <h2 className="type-title text-balance">Six small habits, one quiet home.</h2>
          <p className="type-body text-muted-foreground text-pretty">
            Nothing here is a treatment plan. It&apos;s a set of ordinary tools for paying
            attention to yourself, a little at a time.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface flex flex-col gap-4 p-6">
              <span
                aria-hidden
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  TONES[feature.tone],
                )}
              >
                <feature.icon className="size-5" />
              </span>
              <div className="space-y-1.5">
                <h3 className="type-heading">{feature.title}</h3>
                <p className="type-caption text-pretty">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
