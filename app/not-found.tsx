import { Compass } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container width="prose" className="flex min-h-dvh items-center justify-center py-16">
      <div className="space-y-5 text-center">
        <span
          aria-hidden
          className="bg-brand-muted text-brand-strong mx-auto flex size-12 items-center justify-center rounded-full"
        >
          <Compass className="size-5" />
        </span>
        <div className="space-y-2">
          <h1 className="type-title">There&apos;s nothing at this address</h1>
          <p className="type-caption text-pretty">
            The page you followed doesn&apos;t exist. Head back to the start.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </Container>
  );
}
