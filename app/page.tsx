import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { DisclaimerNote } from "@/components/shared/disclaimer-note";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

/**
 * Placeholder home page. The full landing page replaces this in the next module;
 * for now it is a way into the design system reference.
 */
export default function Home() {
  return (
    <main id="main" className="aurora flex min-h-dvh items-center">
      <Container width="prose" className="py-20">
        <div className="animate-rise space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="type-eyebrow">Foundations ready</p>
            <ThemeToggle />
          </div>
          <h1 className="type-display text-balance">{APP_NAME}</h1>
          <p className="type-body text-muted-foreground max-w-prose text-pretty">
            {APP_TAGLINE} The design system and local data layer are in place. The landing
            page, setup wizard and features come next.
          </p>
          <Button asChild size="lg">
            <Link href="/design">
              View the design system
              <ArrowRight />
            </Link>
          </Button>
          <DisclaimerNote className="max-w-prose" />
        </div>
      </Container>
    </main>
  );
}
