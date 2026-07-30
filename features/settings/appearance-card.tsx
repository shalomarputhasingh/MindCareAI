"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Segmented light/dark/system control for the settings page. */
export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <SectionCard
      title="Appearance"
      description="Choose how MindCareAI looks on this device."
    >
      <div
        role="radiogroup"
        aria-label="Theme"
        className="border-border bg-muted inline-flex w-full gap-1 rounded-lg border p-1 sm:w-auto"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = mounted && theme === value;
          return (
            <Button
              key={value}
              type="button"
              variant={active ? "default" : "ghost"}
              size="sm"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(value)}
              className={cn("flex-1 sm:flex-none", !active && "text-muted-foreground")}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Button>
          );
        })}
      </div>
    </SectionCard>
  );
}
