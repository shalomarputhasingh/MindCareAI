/**
 * Shared domain types for MindCareAI.
 *
 * These are used on both sides of the wire: client components and the local
 * route handlers under `app/api`.
 */

/* -------------------------------------------------------------------------- */
/*                                AI providers                                */
/* -------------------------------------------------------------------------- */

export type Provider = "openrouter" | "groq" | "gemini";

export const PROVIDERS = ["openrouter", "groq", "gemini"] as const;

export function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

/** A model as returned by a provider's model-listing endpoint, normalised. */
export interface AiModel {
  /** The id to send in an API request, e.g. `anthropic/claude-3.5-sonnet`. */
  id: string;
  /** Human-friendly name; falls back to `id` when the provider gives none. */
  label: string;
  /** Context window in tokens, when the provider reports it. */
  contextLength?: number;
  /** Free-text descriptor shown as secondary text in the picker. */
  description?: string;
}

/**
 * Voice preferences.
 *
 * `cloudInput` is opt-in and off by default, because transcription is the one
 * feature in this app that sends the user's own words off the machine. Output
 * runs through the browser's on-device speech synthesis, so it costs nothing
 * and sends nothing.
 */
export interface VoiceSettings {
  /** Allow audio to be uploaded to the chosen provider for transcription. */
  cloudInput: boolean;
  /** Read assistant replies aloud. */
  speakReplies: boolean;
  /** `SpeechSynthesisVoice.voiceURI`, or "" for the browser default. */
  voiceURI: string;
  /** Playback rate, 0.5–1.5. Slightly under 1 suits this app. */
  rate: number;
}

/** Settings live entirely in localStorage — the API key never touches disk. */
export interface AppSettings {
  provider: Provider | null;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  /** Set once the setup wizard has been completed. */
  onboarded: boolean;
  voice: VoiceSettings;
}

/* -------------------------------------------------------------------------- */
/*                                    Chat                                    */
/* -------------------------------------------------------------------------- */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                    Mood                                    */
/* -------------------------------------------------------------------------- */

/** 1 = struggling, 5 = great. */
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  date: string;
  score: MoodScore;
  note?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Journal                                   */
/* -------------------------------------------------------------------------- */

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  wordCount: number;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Habits                                   */
/* -------------------------------------------------------------------------- */

/**
 * The user's habit *definitions* live in localStorage; completion history lives
 * in SQLite as one `Habit` row per habit per day.
 */
export interface HabitDefinition {
  /** Stable slug used to match localStorage definitions to database rows. */
  name: string;
  /** Lucide icon name, resolved at render time. */
  icon: string;
  isCustom: boolean;
}

export interface HabitLog {
  name: string;
  icon?: string | null;
  completed: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               Notifications                                */
/* -------------------------------------------------------------------------- */

export interface NotificationPreferences {
  enabled: boolean;
  water: boolean;
  meditation: boolean;
  journal: boolean;
  sleep: boolean;
}
