"use client";

import { LifeBuoy, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Shown when the crisis screen trips on a message.
 *
 * It offers a route to real human help and says plainly what this app is not.
 * It never claims anything has been detected *about* the person, and it never
 * suggests anyone has been contacted.
 */
export function SupportBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="region"
      aria-label="Support resources"
      className="border-border bg-card shadow-soft flex items-start gap-3 rounded-xl border p-4"
    >
      <span
        aria-hidden
        className="bg-brand-muted text-brand-strong flex size-9 shrink-0 items-center justify-center rounded-full"
      >
        <LifeBuoy className="size-4" />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="type-heading text-sm">If things feel like too much right now</p>
        <p className="type-caption text-pretty">
          Talking to someone you trust can help. If you are in immediate danger, please
          contact your local emergency services or a qualified mental health professional.
          MindCareAI is a companion, not a replacement for professional help.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/support">See support options</Link>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDismiss}
        aria-label="Dismiss support message"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
