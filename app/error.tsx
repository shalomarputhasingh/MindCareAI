"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Everything runs locally, so the browser console is the only log there is.
    console.error(error);
  }, [error]);

  return (
    <Container width="prose" className="flex min-h-dvh items-center justify-center py-16">
      <div className="space-y-5 text-center">
        <span
          aria-hidden
          className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full"
        >
          <TriangleAlert className="size-5" />
        </span>
        <div className="space-y-2">
          <h1 className="type-title">This screen didn&apos;t load</h1>
          <p className="type-caption text-pretty">
            Your journal, moods and habits are stored on this device and are unaffected.
            Try again, and if it keeps happening the details are in the browser console.
          </p>
        </div>
        {error.digest ? (
          <p className="type-caption font-mono text-xs">Reference: {error.digest}</p>
        ) : null}
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
      </div>
    </Container>
  );
}
