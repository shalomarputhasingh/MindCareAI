import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/shared/container";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

const SECTION_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#why", label: "Why MindCareAI" },
  { href: "#faq", label: "FAQ" },
];

/** The marketing header: wordmark, a few in-page anchors, theme, and the one CTA into the app. */
export function SiteHeader() {
  return (
    <header className="bg-background/85 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <Container width="wide" className="flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="min-w-0 rounded-lg">
          <BrandMark />
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground rounded-md text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/app">
              Open<span className="hidden xs:inline">&nbsp;app</span>
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
