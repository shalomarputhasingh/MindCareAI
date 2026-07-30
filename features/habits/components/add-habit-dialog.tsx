"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { HABIT_ICON_OPTIONS } from "@/features/habits/lib/icon-map";

interface AddHabitDialogProps {
  existingNames: string[];
  onAdd: (name: string, icon: string) => void;
}

export function AddHabitDialog({ existingNames, onAdd }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(HABIT_ICON_OPTIONS[0].name);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();

  function reset() {
    setName("");
    setIcon(HABIT_ICON_OPTIONS[0].name);
    setError(null);
  }

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the habit a name.");
      return;
    }
    if (existingNames.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setError("You already have a habit with that name.");
      return;
    }
    onAdd(trimmed, icon);
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Plus />
          Add a habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a habit</DialogTitle>
          <DialogDescription>Small and specific tends to stick best.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Stretch"
              aria-invalid={error ? true : undefined}
              autoFocus
            />
            {error ? <p className="type-caption text-destructive text-xs">{error}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div role="group" aria-label="Choose an icon" className="grid grid-cols-7 gap-2">
              {HABIT_ICON_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = icon === option.name;
                return (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={selected}
                    aria-label={option.name}
                    onClick={() => setIcon(option.name)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary-strong"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Add habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
