import type { AiModel, MoodScore, Provider } from "@/types";

/**
 * Typed wrappers over the local route handlers.
 *
 * Features call these instead of `fetch`, so URLs and payload shapes live in
 * one place and every error surfaces the same way.
 */

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError("Couldn't reach the app's local server. Is it still running?");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? "That request failed.");
  }

  return (await response.json()) as T;
}

/* ------------------------------- Journal ---------------------------------- */

export interface JournalRecord {
  id: string;
  date: string;
  content: string;
  wordCount: number;
  updatedAt: string;
}

export const journalApi = {
  get: (guestId: string, date: string) =>
    request<{ entry: JournalRecord | null }>(
      `/api/journal?guestId=${guestId}&date=${date}`,
    ).then((r) => r.entry),

  history: (guestId: string, limit = 30) =>
    request<{ entries: JournalRecord[] }>(
      `/api/journal?guestId=${guestId}&history=1&limit=${limit}`,
    ).then((r) => r.entries),

  save: (guestId: string, date: string, content: string) =>
    request<{ entry: JournalRecord }>("/api/journal", {
      method: "PUT",
      body: JSON.stringify({ guestId, date, content }),
    }).then((r) => r.entry),

  remove: (guestId: string, date: string) =>
    request<{ ok: true }>(`/api/journal?guestId=${guestId}&date=${date}`, {
      method: "DELETE",
    }),
};

/* -------------------------------- Mood ------------------------------------ */

export interface MoodRecord {
  id: string;
  date: string;
  score: MoodScore;
  note: string | null;
}

export const moodApi = {
  get: (guestId: string, date: string) =>
    request<{ entry: MoodRecord | null }>(
      `/api/mood?guestId=${guestId}&date=${date}`,
    ).then((r) => r.entry),

  range: (guestId: string, days = 90) =>
    request<{ entries: MoodRecord[] }>(`/api/mood?guestId=${guestId}&days=${days}`).then(
      (r) => r.entries,
    ),

  save: (guestId: string, date: string, score: MoodScore, note?: string) =>
    request<{ entry: MoodRecord }>("/api/mood", {
      method: "PUT",
      body: JSON.stringify({ guestId, date, score, note }),
    }).then((r) => r.entry),
};

/* -------------------------------- Habits ---------------------------------- */

export interface HabitRecord {
  id: string;
  date: string;
  name: string;
  icon: string | null;
  completed: boolean;
}

export const habitsApi = {
  forDay: (guestId: string, date: string) =>
    request<{ logs: HabitRecord[] }>(`/api/habits?guestId=${guestId}&date=${date}`).then(
      (r) => r.logs,
    ),

  range: (guestId: string, days = 30) =>
    request<{ logs: HabitRecord[] }>(`/api/habits?guestId=${guestId}&days=${days}`).then(
      (r) => r.logs,
    ),

  setCompleted: (
    guestId: string,
    date: string,
    name: string,
    completed: boolean,
    icon?: string,
  ) =>
    request<{ log: HabitRecord }>("/api/habits", {
      method: "PUT",
      body: JSON.stringify({ guestId, date, name, completed, icon }),
    }).then((r) => r.log),

  removeHistory: (guestId: string, name: string) =>
    request<{ ok: true }>(
      `/api/habits?guestId=${guestId}&name=${encodeURIComponent(name)}`,
      { method: "DELETE" },
    ),
};

/* --------------------------------- Chat ----------------------------------- */

export interface ChatRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export const chatApi = {
  history: (guestId: string, limit = 200) =>
    request<{ messages: ChatRecord[] }>(
      `/api/chat/history?guestId=${guestId}&limit=${limit}`,
    ).then((r) => r.messages),

  append: (guestId: string, role: "user" | "assistant", content: string) =>
    request<{ message: ChatRecord }>("/api/chat/history", {
      method: "POST",
      body: JSON.stringify({ guestId, role, content }),
    }).then((r) => r.message),

  clear: (guestId: string) =>
    request<{ ok: true }>(`/api/chat/history?guestId=${guestId}`, { method: "DELETE" }),
};

/* -------------------------------- Report ---------------------------------- */

export interface DailyReport {
  date: string;
  mood: { score: MoodScore; note: string | null } | null;
  journal: { wordCount: number; hasContent: boolean } | null;
  habits: { done: number; total: number };
  chatMessages: number;
  streaks: { mood: number; habits: number };
  summary: string;
}

export const reportApi = {
  forDay: (guestId: string, date: string) =>
    request<DailyReport>(`/api/report?guestId=${guestId}&date=${date}`),
};

/* -------------------------------- Backup ---------------------------------- */

export interface BackupData {
  version: number;
  exportedAt: string;
  journals: { date: string; content: string; wordCount: number }[];
  moods: { date: string; score: number; note: string | null }[];
  habits: { date: string; name: string; icon: string | null; completed: boolean }[];
  chat: { role: string; content: string; createdAt: string }[];
  settings?: Record<string, unknown>;
  habitDefinitions?: unknown;
}

export const backupApi = {
  export: (guestId: string) => request<BackupData>(`/api/backup?guestId=${guestId}`),

  import: (guestId: string, data: BackupData) =>
    request<{
      ok: true;
      imported: { journals: number; moods: number; habits: number; chat: number };
      chatSkipped: boolean;
    }>("/api/backup", {
      method: "POST",
      body: JSON.stringify({ guestId, data }),
    }),
};

/* ------------------------------- Provider --------------------------------- */

export const voiceApi = {
  /**
   * Uploads a recording and returns what was heard.
   *
   * Multipart rather than JSON, so the audio isn't inflated by base64 on the
   * way to a route handler running on this same machine.
   */
  transcribe: async (
    provider: Provider,
    apiKey: string,
    audio: Blob,
    model?: string,
    signal?: AbortSignal,
  ): Promise<string> => {
    const form = new FormData();
    form.append("audio", audio, "speech");
    form.append("provider", provider);
    form.append("apiKey", apiKey);
    if (model) form.append("model", model);

    let response: Response;
    try {
      response = await fetch("/api/transcribe", { method: "POST", body: form, signal });
    } catch {
      throw new ApiError("Couldn't reach the app's local server. Is it still running?");
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new ApiError(body?.error ?? "That recording couldn't be transcribed.");
    }

    const body = (await response.json()) as { text: string };
    return body.text;
  },
};

export const providerApi = {
  models: (provider: Provider, apiKey: string) =>
    request<{ models: AiModel[] }>("/api/models", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    }).then((r) => r.models),

  validate: (provider: Provider, apiKey: string) =>
    request<{ ok: true; modelCount: number }>("/api/validate", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    }),
};
