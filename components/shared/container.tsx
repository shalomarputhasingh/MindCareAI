import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const widths = {
  /** Reading and writing surfaces — journal, chat, long copy. */
  prose: "max-w-3xl",
  /** The default for app screens. */
  content: "max-w-5xl",
  /** Marketing sections and dashboards. */
  wide: "max-w-6xl",
  full: "max-w-none",
} as const;

interface ContainerProps {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
  as?: ElementType;
}

/** Centres content and owns the horizontal gutter, so nothing else has to. */
export function Container({
  children,
  width = "content",
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-5 sm:px-8", widths[width], className)}>
      {children}
    </Tag>
  );
}
