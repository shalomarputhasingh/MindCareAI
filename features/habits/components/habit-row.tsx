"use client";

import { Check, Flame, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HabitDefinition } from "@/types";

import { resolveHabitIcon } from "@/features/habits/lib/icon-map";

interface HabitRowProps {
  habit: HabitDefinition;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  onDelete: () => void;
}

export function HabitRow({ habit, completed, streak, onToggle, onDelete }: HabitRowProps) {
  const Icon = resolveHabitIcon(habit.icon);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={completed}
        onClick={onToggle}
        className={cn(
          "flex min-h-11 flex-1 items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors",
          completed
            ? "border-brand/40 bg-brand-muted"
            : "border-border bg-card hover:bg-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            completed ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="type-body block truncate font-medium">{habit.name}</span>
        </span>
        {streak > 0 ? (
          <span className="type-caption text-brand-strong tabular flex shrink-0 items-center gap-1 text-xs font-medium">
            <Flame className="size-3.5" />
            {streak}
          </span>
        ) : null}
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border",
            completed
              ? "border-brand bg-brand text-brand-foreground"
              : "border-input bg-transparent",
          )}
        >
          {completed ? <Check className="size-3.5" /> : null}
        </span>
      </button>

      {habit.isCustom ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${habit.name}`}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {habit.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This also deletes its history, including any streak you&rsquo;ve built. This
                can&rsquo;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={onDelete}
              >
                Remove habit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
