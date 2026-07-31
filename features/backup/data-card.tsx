"use client";

import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/shared/section-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useGuestId } from "@/hooks/use-guest-id";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSettings } from "@/hooks/use-settings";
import { ApiError, backupApi, type BackupData } from "@/lib/api-client";
import { DEFAULT_HABITS, STORAGE_KEYS } from "@/lib/constants";
import { toDayKey } from "@/lib/date";
import { isChatLanguage } from "@/lib/language";
import type { AppSettings, HabitDefinition } from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * The settings that travel in a backup — deliberately everything except the API
 * key. A backup file is the one artefact here designed to be moved around and
 * shared, so writing the key into it would undo the whole point of keeping it
 * in this browser only.
 */
function portableSettings(settings: AppSettings) {
  return {
    provider: settings.provider,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    onboarded: settings.onboarded,
    language: settings.language,
  };
}

/**
 * Reads settings back out of a file, field by field. A backup is untrusted
 * input: whitelisting keeps a hand-edited file from injecting an API key or
 * writing junk into settings.
 */
function readPortableSettings(value: unknown): Partial<AppSettings> {
  if (!isRecord(value)) return {};
  const patch: Partial<AppSettings> = {};

  if (value.provider === "openrouter" || value.provider === "groq" || value.provider === "gemini") {
    patch.provider = value.provider;
  }
  if (typeof value.model === "string") patch.model = value.model.slice(0, 200);
  if (typeof value.temperature === "number" && Number.isFinite(value.temperature)) {
    patch.temperature = Math.min(2, Math.max(0, value.temperature));
  }
  if (typeof value.maxTokens === "number" && Number.isFinite(value.maxTokens)) {
    patch.maxTokens = Math.min(32_000, Math.max(64, Math.trunc(value.maxTokens)));
  }
  if (typeof value.onboarded === "boolean") patch.onboarded = value.onboarded;
  if (isChatLanguage(value.language)) patch.language = value.language;

  return patch;
}

/** Keeps only well-formed habit definitions from an imported file. */
function readHabitDefinitionsFrom(value: unknown): HabitDefinition[] | null {
  if (!Array.isArray(value)) return null;

  const cleaned = value.filter(
    (item): item is HabitDefinition =>
      isRecord(item) && typeof item.name === "string" && item.name.trim().length > 0,
  );

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Export/import card for the settings page.
 *
 * Export merges the server-side backup (journals, moods, habits, chat) with
 * the client-side settings and habit definitions into one JSON download.
 * Import restores all of it, after an explicit confirmation — it overwrites
 * any day the file includes.
 */
export function DataCard() {
  const guestId = useGuestId();
  const { settings, update: updateSettings } = useSettings();
  const { setValue: setHabitDefinitions } = useLocalStorage<HabitDefinition[]>(
    STORAGE_KEYS.habits,
    DEFAULT_HABITS,
  );

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<{ fileName: string; data: BackupData } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    if (!guestId) return;
    setExporting(true);
    try {
      const server = await backupApi.export(guestId);
      const merged: BackupData = {
        ...server,
        settings: portableSettings(settings),
        habitDefinitions: readHabitDefinitions(),
      };
      const blob = new Blob([JSON.stringify(merged, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const fileName = `mindcareai-backup-${toDayKey()}.json`;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Backup exported", { description: `Saved as ${fileName}.` });
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Couldn't export your data. Try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  function readHabitDefinitions(): HabitDefinition[] {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.habits);
      if (!raw) return DEFAULT_HABITS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as HabitDefinition[]) : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      toast.error("That file isn't valid JSON. Choose a MindCareAI backup file.");
      return;
    }

    if (!isRecord(parsed)) {
      toast.error("That file doesn't look like a MindCareAI backup.");
      return;
    }

    setPending({ fileName: file.name, data: parsed as unknown as BackupData });
  }

  async function confirmImport() {
    if (!guestId || !pending) return;
    setImporting(true);
    try {
      const result = await backupApi.import(guestId, pending.data);

      const record = pending.data as unknown as Record<string, unknown>;

      // The key is never restored from a file — the one already in this browser
      // stays put, so importing a backup can't swap in someone else's.
      const settingsPatch = readPortableSettings(record.settings);
      if (Object.keys(settingsPatch).length > 0) updateSettings(settingsPatch);

      const definitions = readHabitDefinitionsFrom(record.habitDefinitions);
      if (definitions) setHabitDefinitions(definitions);

      const { journals, moods, habits, chat } = result.imported;
      toast.success("Backup imported", {
        description: `${journals} journal entries, ${moods} mood check-ins, ${habits} habit logs, ${chat} chat messages${
          result.chatSkipped ? " (chat skipped — you already had messages)" : ""
        }.`,
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn't import that backup. Check the file and try again.",
      );
    } finally {
      setImporting(false);
      setPending(null);
    }
  }

  return (
    <SectionCard
      title="Data"
      description="Export everything as one file, or restore from a previous export. Your API key is left out of the backup, so you'll re-enter it after importing."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={handleExport} disabled={!guestId || exporting}>
          <Download className="size-4" aria-hidden />
          {exporting ? "Exporting…" : "Export backup"}
        </Button>
        <Button type="button" variant="outline" onClick={openFilePicker} disabled={!guestId || importing}>
          <Upload className="size-4" aria-hidden />
          {importing ? "Importing…" : "Import backup"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Choose a MindCareAI backup file"
          onChange={handleFileSelected}
        />
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending
                ? `"${pending.fileName}" will overwrite any day it includes — journal entries, mood
                   check-ins, habit logs and settings. Days not in the file are left alone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Import backup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
