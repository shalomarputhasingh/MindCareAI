import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  /** Control shown at the end of the title row. */
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * The standard panel used across the app: a titled card with optional footer.
 * Use it instead of composing `Card` by hand so spacing stays uniform.
 */
export function SectionCard({
  children,
  title,
  description,
  action,
  footer,
  className,
  contentClassName,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Card className={className}>
      {hasHeader ? (
        <CardHeader>
          {title ? <CardTitle className="type-heading">{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent className={contentClassName}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
