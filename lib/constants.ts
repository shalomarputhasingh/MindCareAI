import { CHAT_LANGUAGES, type ChatLanguage } from "@/lib/language";
import type {
  AppSettings,
  HabitDefinition,
  MoodScore,
  NotificationPreferences,
  Provider,
  VoiceSettings,
} from "@/types";

/** Every localStorage key the app writes, in one place. */
export const STORAGE_KEYS = {
  guestId: "mindcare.guest-id",
  settings: "mindcare.settings",
  habits: "mindcare.habits",
  notifications: "mindcare.notifications",
  theme: "mindcare.theme",
} as const;

export const APP_NAME = "MindCareAI";
export const APP_TAGLINE = "A calmer place to check in with yourself.";
export const APP_DESCRIPTION =
  "MindCareAI is an AI wellbeing companion for daily reflection, mood tracking and healthy habits. It runs entirely on your own machine.";

/**
 * Shown wherever the app could be mistaken for clinical care. MindCareAI is a
 * companion, not a medical service.
 */
export const DISCLAIMER =
  "MindCareAI is a wellbeing companion, not a medical service. It is not a therapist, doctor or emergency service, and it is not a substitute for professional help.";

/**
 * Voice defaults. Cloud transcription starts off: it is the one thing here that
 * would send the user's own words off this machine, so it has to be chosen
 * rather than discovered. Speaking replies is on-device and free, but it stays
 * off too, because audio starting unprompted is startling.
 */
export const DEFAULT_VOICE: VoiceSettings = {
  cloudInput: false,
  speakReplies: false,
  voiceURI: "",
  // A shade under natural pace. This app should never sound hurried.
  rate: 0.95,
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: null,
  apiKey: "",
  model: "",
  temperature: 0.7,
  // Reasoning models spend tokens thinking before they write anything, and a
  // tight budget can be used up before a single word of the reply appears.
  maxTokens: 2048,
  onboarded: false,
  voice: DEFAULT_VOICE,
  // Following the person is the kinder default than making them find a picker
  // before the app will answer in their own language.
  language: "auto",
};

/** Display metadata for each supported provider. */
export const PROVIDER_META: Record<
  Provider,
  { label: string; blurb: string; keyPrefix: string; keyUrl: string }
> = {
  openrouter: {
    label: "OpenRouter",
    blurb: "One key, hundreds of models from every major lab.",
    keyPrefix: "sk-or-",
    keyUrl: "https://openrouter.ai/keys",
  },
  groq: {
    label: "Groq",
    blurb: "Open models served extremely fast, with a generous free tier.",
    keyPrefix: "gsk_",
    keyUrl: "https://console.groq.com/keys",
  },
  gemini: {
    label: "Google Gemini",
    blurb: "Google's models, straight from the Gemini API.",
    keyPrefix: "AIza",
    keyUrl: "https://aistudio.google.com/apikey",
  },
};

/**
 * Languages the assistant can hold a conversation in. The interface itself is
 * English throughout; this is about the conversation.
 */
export const LANGUAGE_OPTIONS: ChatLanguage[] = [...CHAT_LANGUAGES];

export const MOOD_OPTIONS: {
  score: MoodScore;
  emoji: string;
  label: string;
}[] = [
  { score: 5, emoji: "😀", label: "Great" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 2, emoji: "😔", label: "Low" },
  { score: 1, emoji: "😭", label: "Struggling" },
];

export const DEFAULT_HABITS: HabitDefinition[] = [
  { name: "Drink Water", icon: "GlassWater", isCustom: false },
  { name: "Exercise", icon: "Footprints", isCustom: false },
  { name: "Meditation", icon: "Flower2", isCustom: false },
  { name: "Sleep", icon: "Moon", isCustom: false },
  { name: "Reading", icon: "BookOpen", isCustom: false },
];

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  enabled: false,
  water: true,
  meditation: true,
  journal: true,
  sleep: true,
};

/**
 * Navigation lives in `components/layout/nav-config.ts` so each item can hold a
 * real Lucide component rather than an icon name that has to be looked up.
 */
