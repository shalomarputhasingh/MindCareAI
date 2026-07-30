import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

/**
 * Standard padding and rhythm for an in-app screen. Every feature page starts
 * with this so the gutter and vertical spacing never vary between sections.
 */
export function AppPage({
  children,
  width = "content",
  className,
}: {
  children: ReactNode;
  width?: "prose" | "content" | "wide" | "full";
  className?: string;
}) {
  return (
    <Container width={width} className={cn("space-y-7 py-8 sm:py-10", className)}>
      {children}
    </Container>
  );
}
