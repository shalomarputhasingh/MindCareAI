"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AiModel } from "@/types";

interface ModelPickerProps {
  id?: string;
  models: AiModel[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Searchable model picker (Popover + Command), the pattern demoed in
 * `components/design/interactive-preview.tsx`.
 *
 * Shared by the setup wizard and the settings page. Models always come from a
 * provider's live catalogue — see `useModelCatalog` — never hardcoded here.
 */
export function ModelPicker({
  id,
  models,
  value,
  onChange,
  loading = false,
  disabled = false,
  placeholder = "Fetch models first",
  className,
}: ModelPickerProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = useState(false);

  const selected = models.find((model) => model.id === value);
  const label = loading ? "Loading models…" : selected?.label || value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={triggerId}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading || models.length === 0}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{label}</span>
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-60" aria-hidden />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models…" />
          <CommandList>
            <CommandEmpty>No model matches that search.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={`${model.label} ${model.id}`}
                  onSelect={() => {
                    onChange(model.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", value === model.id ? "opacity-100" : "opacity-0")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{model.label}</span>
                    {model.contextLength ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {model.contextLength.toLocaleString()} tokens context
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
