"use client";

import { Info, Languages, Mic, Volume2 } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasVoiceFor, useSpeech } from "@/features/chat/use-speech";
import { useSettings } from "@/hooks/use-settings";
import { supportsTranscription } from "@/lib/ai/voice";
import { LANGUAGE_OPTIONS, PROVIDER_META } from "@/lib/constants";
import { describeSpeechLang, LANGUAGE_META, speechLangFor } from "@/lib/language";
import type { ChatLanguage } from "@/types";

/**
 * Which language the assistant talks in.
 *
 * Saved immediately rather than behind a Save button, unlike the provider card
 * above it — there is nothing to validate, and someone who has just realised
 * they can be answered in Tamil should not have to hunt for a button first.
 */
export function LanguageCard() {
  const { settings, update, hydrated } = useSettings();
  const { voices, supported: speechSupported } = useSpeech();

  const language = settings.language;
  const { provider } = settings;

  const browserLocale = typeof navigator === "undefined" ? "" : navigator.language;
  const listening = describeSpeechLang(speechLangFor(language, browserLocale));

  const providerLabel = provider ? PROVIDER_META[provider].label : "your provider";
  const cloudTranscription =
    settings.voice.cloudInput &&
    provider !== null &&
    supportsTranscription(provider) &&
    Boolean(settings.apiKey);

  // Only worth warning about a missing Tamil voice once Tamil is on the table.
  const tamilInPlay = language === "ta" || language === "auto";
  const tamilVoiceMissing =
    speechSupported && voices.length > 0 && tamilInPlay && !hasVoiceFor(voices, "ta");

  return (
    <SectionCard
      title="Language"
      description="Which language the assistant replies in. The app's own buttons and labels stay in English."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chat-language">Reply in</Label>
          <Select
            value={language}
            onValueChange={(value) => update({ language: value as ChatLanguage })}
            disabled={!hydrated}
          >
            <SelectTrigger id="chat-language" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "auto"
                    ? LANGUAGE_META[option].label
                    : `${LANGUAGE_META[option].nativeLabel} — ${LANGUAGE_META[option].label}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="type-caption text-xs">{LANGUAGE_META[language].hint}</p>
        </div>

        <p className="text-muted-foreground bg-muted flex items-start gap-2 rounded-md px-3 py-2.5 text-xs">
          <Languages aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {language === "auto" ? (
              <>
                Write in Tamil and you&apos;ll be answered in Tamil. Write Tamil in English
                letters — <em>enakku romba stress-a iruku</em> — and the reply comes back
                the same way, rather than in Tamil script you didn&apos;t ask for.
              </>
            ) : language === "ta" ? (
              <>
                Replies come back in Tamil however you write, in everyday spoken Tamil
                rather than the formal written kind.
              </>
            ) : (
              <>Replies come back in English however you write.</>
            )}
          </span>
        </p>

        {/* ---------------------------- Speaking ---------------------------- */}
        <div className="space-y-2.5">
          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <Mic aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {cloudTranscription ? (
                <>
                  Dictation goes to {providerLabel}, which works out the language on its
                  own
                  {language === "auto"
                    ? " — so you can switch between Tamil and English mid-conversation."
                    : `, with Tamil${language === "ta" ? "" : " or English"} as a hint.`}
                </>
              ) : (
                <>
                  Dictation is handled by your browser, which listens for{" "}
                  <strong className="text-foreground font-medium">
                    one language at a time
                  </strong>{" "}
                  — right now, {listening}.{" "}
                  {language === "auto" ? (
                    <>
                      That comes from your browser&apos;s own locale, so &ldquo;Match what I
                      write&rdquo; can&apos;t cover speech. Choose Tamil above to speak
                      Tamil, or switch on cloud transcription in Voice, which detects it
                      for you.
                    </>
                  ) : null}
                </>
              )}
            </span>
          </p>

          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <Volume2 aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Replies are read aloud in whichever language they arrive in. A Tamil reply
              picks a Tamil voice from your device{tamilVoiceMissing ? "" : ", whatever you chose under Voice"}
              {tamilVoiceMissing ? " — if there is one, which there isn't here" : ""}.
            </span>
          </p>

          {tamilVoiceMissing ? (
            <div className="border-border space-y-2 rounded-md border border-dashed p-3">
              <p className="text-muted-foreground flex items-start gap-2 text-xs">
                <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <strong className="text-foreground font-medium">
                    This device has no Tamil voice installed.
                  </strong>{" "}
                  Tamil replies are still read aloud, but they are rewritten in English
                  letters first and spoken by an English voice — understandable, and
                  clearly not a Tamil accent. Adding a real voice is a one-off:
                </span>
              </p>
              <ul className="text-muted-foreground ml-[1.375rem] list-disc space-y-1 pl-3 text-xs">
                <li>
                  <strong className="text-foreground font-medium">Windows</strong> —
                  Settings → Time &amp; language → Language &amp; region → Add a language →
                  Tamil, and tick Speech before installing.
                </li>
                <li>
                  <strong className="text-foreground font-medium">macOS &amp; iOS</strong> —
                  System Settings → Accessibility → Spoken Content → System Voice → Manage
                  Voices → Tamil.
                </li>
                <li>
                  <strong className="text-foreground font-medium">Android</strong> —
                  Settings → System → Languages &amp; input → Text-to-speech → install the
                  Tamil voice data.
                </li>
              </ul>
              <p className="text-muted-foreground ml-[1.375rem] text-xs">
                Restart your browser afterwards. If Tamil still doesn&apos;t appear in the
                voice list above, try a different browser — they don&apos;t all read the
                same set of system voices.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
