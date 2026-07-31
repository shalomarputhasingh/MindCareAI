"use client";

import { Check, ExternalLink } from "lucide-react";

import { PROVIDER_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Provider } from "@/types";

interface ProviderCardProps {
  provider: Provider;
  selected: boolean;
  onSelect: (provider: Provider) => void;
}

/** A selectable provider card for the setup wizard, built from `PROVIDER_META`. */
export function ProviderCard({ provider, selected, onSelect }: ProviderCardProps) {
  const meta = PROVIDER_META[provider];

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border p-5 transition-colors",
        selected ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(provider)}
        aria-pressed={selected}
        className="focus-visible:outline-ring rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-transparent",
          )}
        >
          <Check className="size-3.5" />
        </span>
        <span className="type-heading block pr-8">{meta.label}</span>
        <span className="type-caption mt-1 block text-pretty">{meta.blurb}</span>
      </button>
      <a
        href={meta.keyUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="text-primary-strong -mb-1 mt-0.5 inline-flex w-fit items-center gap-1 py-1.5 text-xs font-medium hover:underline"
      >
        Get a key
        <ExternalLink className="size-3" aria-hidden />
      </a>
    </div>
  );
}
