import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { DisclaimerNote } from "@/components/shared/disclaimer-note";
import { Button } from "@/components/ui/button";
import { APP_TAGLINE } from "@/lib/constants";

import { BreathingVisual } from "./breathing-visual";

/** The signature moment: a slow, breathing aurora field behind the headline. */
export function Hero() {
  return (
    <section className="border-border relative overflow-hidden border-b">
      <div
        aria-hidden
        className="aurora animate-breathe pointer-events-none absolute inset-0 origin-center"
      />

      <Container
        width="wide"
        className="relative grid gap-14 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10"
      >
        <div className="animate-rise space-y-7">
          <p className="type-eyebrow">Private by design</p>
          <h1 className="type-display text-balance">{APP_TAGLINE}</h1>
          <p className="type-body text-muted-foreground max-w-prose text-pretty">
            Talk something through, log how you&apos;re feeling, write a few lines before
            bed. MindCareAI keeps a quiet daily rhythm going — no account to make, no cloud
            to trust, nothing saved anywhere but this device.
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 pt-1">
            <Button asChild size="xl">
              <Link href="/app">
                Start your first check-in
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="link" size="lg">
              <a href="#why">
                See how it stays private
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </div>

          <DisclaimerNote className="max-w-prose" />
        </div>

        <div className="animate-rise [animation-delay:150ms]">
          <BreathingVisual />
        </div>
      </Container>
    </section>
  );
}
