/**
 * Conversation language.
 *
 * MindCareAI holds conversations in English and Tamil. This is deliberately not
 * an interface-translation layer — the app's own buttons and labels stay in
 * English — it governs the part that matters most, which is the language a
 * person is met in when they sit down to talk about how they are.
 *
 * Everything here is shared by the browser and the local route handlers, so it
 * must not touch `window` or `navigator`. Callers pass the browser locale in.
 */

export type ChatLanguage = "auto" | "en" | "ta";

export const CHAT_LANGUAGES = ["auto", "en", "ta"] as const;

export function isChatLanguage(value: unknown): value is ChatLanguage {
  return (
    typeof value === "string" && (CHAT_LANGUAGES as readonly string[]).includes(value)
  );
}

export interface LanguageMeta {
  /** English name, for anyone reading the settings list in English. */
  label: string;
  /** The language's own name, so it can be found without reading English. */
  nativeLabel: string;
  /** One line of help under the picker. */
  hint: string;
}

export const LANGUAGE_META: Record<ChatLanguage, LanguageMeta> = {
  auto: {
    label: "Match what I write",
    nativeLabel: "Automatic",
    hint: "Replies come back in whichever language you used.",
  },
  en: {
    label: "English",
    nativeLabel: "English",
    hint: "Replies are always in English.",
  },
  ta: {
    label: "Tamil",
    nativeLabel: "தமிழ்",
    hint: "Replies are always in Tamil, however you write.",
  },
};

/* -------------------------------------------------------------------------- */
/*                            Speech tags and codes                           */
/* -------------------------------------------------------------------------- */

/**
 * BCP-47 tag for `SpeechRecognition.lang` and `SpeechSynthesisUtterance.lang`.
 *
 * The Web Speech recogniser listens in exactly one language at a time, so
 * "auto" can only mean the browser's own locale. Choosing Tamil explicitly is
 * what makes Tamil dictation work on that path; cloud transcription detects the
 * language itself and needs no such help.
 */
export function speechLangFor(language: ChatLanguage, browserLocale?: string): string {
  const locale = (browserLocale ?? "").trim();

  if (language === "ta") return "ta-IN";
  if (language === "en") return /^en\b/i.test(locale) ? locale : "en-US";
  return locale || "en-US";
}

/**
 * ISO-639-1 hint for a transcription API, or `undefined` to let it detect.
 *
 * Whisper is markedly more accurate on Tamil when it is told the language up
 * front — left to guess, short or hesitant utterances often come back
 * transliterated into Latin script, or as the wrong Indian language entirely.
 */
export function transcriptionHintFor(language: ChatLanguage): string | undefined {
  if (language === "ta") return "ta";
  if (language === "en") return "en";
  return undefined;
}

/** The primary subtag of a BCP-47 tag: `ta-IN` → `ta`. */
export function primarySubtag(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0];
}

/**
 * A readable name for a BCP-47 tag: `ta-IN` → "Tamil". Used to say out loud
 * which language the browser recogniser is currently listening for, since it
 * only ever listens for one and that is not otherwise visible anywhere.
 */
export function describeSpeechLang(tag: string): string {
  const primary = primarySubtag(tag);
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(primary) ?? primary;
  } catch {
    return primary;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Script detection                              */
/* -------------------------------------------------------------------------- */

/** The Tamil Unicode block, U+0B80–U+0BFF. */
const TAMIL_CHARACTERS = /[஀-௿]/g;
const LATIN_LETTERS = /[A-Za-z]/g;

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

/**
 * Which language a piece of text is *written* in, used to choose a voice for
 * reading it aloud. Returns null when there is nothing to go on.
 *
 * Biased towards Tamil, because the failure modes are not symmetrical: an
 * English voice handed Tamil script produces silence or spelled-out nonsense,
 * whereas the Indian-English and Tamil voices shipped with most systems read an
 * English word inside a Tamil sentence perfectly well.
 *
 * This cannot see romanised Tamil — "enakku kastama iruku" is all Latin letters
 * — and reports it as English. That is the right answer anyway, since an
 * English voice pronounces romanised Tamil far more intelligibly than a Tamil
 * voice trying to read Latin script.
 */
export function detectSpokenLanguage(text: string): "ta" | "en" | null {
  const tamil = count(text, TAMIL_CHARACTERS);
  const latin = count(text, LATIN_LETTERS);

  if (tamil === 0) return latin > 0 ? "en" : null;
  if (latin === 0) return "ta";
  return tamil * 3 >= latin ? "ta" : "en";
}

/**
 * The tag a reply should be spoken with: what the setting asks for, unless the
 * text plainly disagrees. In "auto" the text is the only evidence there is, and
 * even on a fixed setting a model occasionally answers in the other language —
 * following the text means it is still read in a voice that can pronounce it.
 */
export function spokenLangFor(
  language: ChatLanguage,
  text: string,
  browserLocale?: string,
): string {
  const detected = detectSpokenLanguage(text);
  if (detected === "ta") return "ta-IN";
  if (detected === "en" && language === "ta") return speechLangFor("en", browserLocale);
  return speechLangFor(language, browserLocale);
}
