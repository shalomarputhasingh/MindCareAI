"use client";

import { CloudUpload, Info, MonitorSmartphone, Play, Volume2 } from "lucide-react";
import { useMemo } from "react";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSpeech } from "@/features/chat/use-speech";
import { useSettings } from "@/hooks/use-settings";
import { supportsTranscription } from "@/lib/ai/voice";
import { PROVIDER_META } from "@/lib/constants";
import { primarySubtag, speechLangFor } from "@/lib/language";

const BROWSER_VOICE = "__browser_default__";

/**
 * The sample is spoken in the language replies will actually arrive in — the
 * only way to find out whether this device can read Tamil aloud is to hear it
 * try.
 */
const SAMPLES: Record<string, string> = {
  en: "This is how replies will sound. Take a breath — there's no rush.",
  ta: "பதில்கள் இப்படித்தான் ஒலிக்கும். ஒரு நிமிஷம் மூச்சு விடுங்க, அவசரமே இல்ல.",
};

/**
 * Voice preferences.
 *
 * The cloud-transcription switch is the only control in MindCareAI that can
 * send raw audio off this machine, so it is off by default and says plainly
 * where the recording goes before it is turned on.
 */
export function VoiceCard() {
  const { settings, updateVoice, hydrated } = useSettings();
  const { supported: speechSupported, voices, speak, stop, speaking } = useSpeech();

  const { provider, apiKey, voice } = settings;
  const cloudCapable = provider !== null && supportsTranscription(provider);
  const providerLabel = provider ? PROVIDER_META[provider].label : "your provider";

  // The chosen language first, so a Tamil speaker isn't scrolling past forty
  // English voices to find one that can read a Tamil reply. Then local voices,
  // which people recognise and which don't have the latency that makes a remote
  // voice feel broken.
  const browserLocale = typeof navigator === "undefined" ? "" : navigator.language;
  const sampleLang = speechLangFor(settings.language, browserLocale);
  const wanted = primarySubtag(sampleLang);
  const sortedVoices = useMemo(
    () =>
      [...voices].sort((a, b) => {
        const aWanted = primarySubtag(a.lang) === wanted;
        const bWanted = primarySubtag(b.lang) === wanted;
        if (aWanted !== bWanted) return aWanted ? -1 : 1;
        if (a.localService !== b.localService) return a.localService ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [voices, wanted],
  );

  function preview() {
    if (speaking) {
      stop();
      return;
    }
    speak(SAMPLES[wanted] ?? SAMPLES.en, {
      voiceURI: voice.voiceURI,
      rate: voice.rate,
      lang: sampleLang,
    });
  }

  return (
    <SectionCard
      title="Voice"
      description="Speak instead of typing, and have replies read back to you."
    >
      <div className="space-y-4">
        {/* ------------------------- Speech to text ------------------------- */}
        <div className="border-border space-y-3 rounded-lg border p-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <CloudUpload
                className={
                  voice.cloudInput
                    ? "text-brand-strong mt-0.5 size-4 shrink-0"
                    : "text-muted-foreground mt-0.5 size-4 shrink-0"
                }
                aria-hidden
              />
              <div className="space-y-0.5">
                <Label htmlFor="voice-cloud-input">
                  Transcribe with {providerLabel}
                </Label>
                <p className="type-caption text-xs">
                  More accurate than your browser, especially with background noise.
                </p>
              </div>
            </div>
            <Switch
              id="voice-cloud-input"
              checked={hydrated && voice.cloudInput && cloudCapable}
              onCheckedChange={(checked) => updateVoice({ cloudInput: checked })}
              disabled={!hydrated || !cloudCapable}
            />
          </div>

          <p className="text-muted-foreground bg-muted flex items-start gap-2 rounded-md px-3 py-2.5 text-xs">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {cloudCapable ? (
                voice.cloudInput ? (
                  <>
                    <strong className="text-foreground font-medium">
                      Your recording is uploaded to {providerLabel}.
                    </strong>{" "}
                    It passes through this app&apos;s local server on the way and is
                    never saved to disk, but the audio itself does leave this machine
                    and is handled under {providerLabel}&apos;s own policy. Turn this
                    off and dictation stays with your browser instead.
                  </>
                ) : (
                  <>
                    Dictation is handled by your browser&apos;s own recogniser. Some
                    browsers — Chrome and Edge in particular — send that audio to their
                    vendor&apos;s servers; Safari and Firefox handle it on-device. Turn
                    this on to use {providerLabel} instead, which uploads the recording
                    to {providerLabel}.
                  </>
                )
              ) : provider ? (
                <>
                  {providerLabel} doesn&apos;t offer transcription. Dictation falls back
                  to your browser&apos;s own recogniser. Switch to Groq or Gemini above
                  if you want cloud transcription.
                </>
              ) : (
                <>
                  Choose a provider above to see your transcription options. Until then,
                  dictation uses your browser&apos;s own recogniser.
                </>
              )}
            </span>
          </p>

          {cloudCapable && voice.cloudInput && !apiKey ? (
            <p className="type-caption text-xs">
              Add your API key above before dictation can reach {providerLabel}.
            </p>
          ) : null}
        </div>

        {/* ------------------------- Text to speech ------------------------- */}
        <div className="border-border space-y-4 rounded-lg border p-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <Volume2
                className={
                  voice.speakReplies
                    ? "text-brand-strong mt-0.5 size-4 shrink-0"
                    : "text-muted-foreground mt-0.5 size-4 shrink-0"
                }
                aria-hidden
              />
              <div className="space-y-0.5">
                <Label htmlFor="voice-speak-replies">Read replies aloud</Label>
                <p className="type-caption text-xs">
                  {speechSupported
                    ? "Spoken by your device — nothing is sent anywhere. Quiet during a support message, and always on in live voice chat."
                    : "This browser has no speech voices installed."}
                </p>
              </div>
            </div>
            <Switch
              id="voice-speak-replies"
              checked={hydrated && voice.speakReplies && speechSupported}
              onCheckedChange={(checked) => updateVoice({ speakReplies: checked })}
              disabled={!hydrated || !speechSupported}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="voice-picker">Voice</Label>
              <Select
                value={voice.voiceURI || BROWSER_VOICE}
                onValueChange={(value) =>
                  updateVoice({ voiceURI: value === BROWSER_VOICE ? "" : value })
                }
                disabled={!speechSupported || sortedVoices.length === 0}
              >
                <SelectTrigger id="voice-picker" className="w-full">
                  <SelectValue placeholder="Browser default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BROWSER_VOICE}>Browser default</SelectItem>
                  {sortedVoices.map((option) => (
                    <SelectItem key={option.voiceURI} value={option.voiceURI}>
                      {option.name} ({option.lang})
                      {option.localService ? "" : " · online"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="type-caption text-xs">
                A preference, not a rule: a reply in another language is read by a voice
                that can pronounce it.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-rate">Speed</Label>
                <span className="tabular type-caption text-xs">
                  {voice.rate.toFixed(2)}×
                </span>
              </div>
              <Slider
                id="voice-rate"
                min={0.5}
                max={1.5}
                step={0.05}
                value={[voice.rate]}
                onValueChange={([value]) => updateVoice({ rate: value })}
                disabled={!speechSupported}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={preview}
              disabled={!speechSupported}
            >
              <Play className="size-3.5" aria-hidden />
              {speaking ? "Stop" : "Hear a sample"}
            </Button>
            <span className="type-caption inline-flex items-center gap-1.5 text-xs">
              <MonitorSmartphone className="size-3.5" aria-hidden />
              Voices come from this device.
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
