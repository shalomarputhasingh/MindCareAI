"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ApiKeyInput, ModelPicker, useModelCatalog, useValidateKey } from "@/features/setup";
import { useSettings } from "@/hooks/use-settings";
import { PROVIDER_META } from "@/lib/constants";
import { PROVIDERS, type Provider } from "@/types";

const MIN_TOKENS = 64;
const MAX_TOKENS = 32000;

/**
 * The provider / key / model / generation-parameter card on the settings
 * page. Edits are local (a draft) until "Save settings" is pressed, which
 * matches the explicit Test / Refresh / Save button trio in the brief.
 */
export function AiSettingsCard() {
  const { settings, update, hydrated } = useSettings();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const seededRef = useRef(false);

  const { models, loading: modelsLoading, fetchModels, setModels } = useModelCatalog();
  const {
    status: validateStatus,
    error: validateError,
    modelCount,
    validate,
    reset: resetValidate,
  } = useValidateKey();

  useEffect(() => {
    if (!hydrated || seededRef.current) return;
    seededRef.current = true;
    setProvider(settings.provider);
    setApiKey(settings.apiKey);
    setModel(settings.model);
    setTemperature(settings.temperature);
    setMaxTokens(settings.maxTokens);
    // Only ever seed once, from whatever is in storage at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  function handleProviderChange(next: Provider) {
    if (next === provider) return;
    setProvider(next);
    setApiKey("");
    setModel("");
    setModels([]);
    resetValidate();
  }

  function handleApiKeyChange(next: string) {
    setApiKey(next);
    setModels([]);
    if (validateStatus !== "idle") resetValidate();
  }

  async function handleTest() {
    if (!provider) {
      toast.error("Choose a provider first.");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Enter an API key first.");
      return;
    }
    const result = await validate(provider, apiKey.trim());
    if (result.ok) {
      toast.success("Connection works", {
        description: `${result.modelCount} model${result.modelCount === 1 ? "" : "s"} available.`,
      });
    } else {
      toast.error(result.error);
    }
  }

  async function handleRefreshModels() {
    if (!provider) {
      toast.error("Choose a provider first.");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Enter an API key first.");
      return;
    }
    try {
      const list = await fetchModels(provider, apiKey.trim());
      toast.success("Models refreshed", {
        description: `${list.length} model${list.length === 1 ? "" : "s"} available.`,
      });
    } catch {
      toast.error("Couldn't load models. Check your key and connection.");
    }
  }

  function handleSave() {
    if (!provider) {
      toast.error("Choose a provider first.");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Enter an API key first.");
      return;
    }
    // Without a model the app counts as unconfigured, and the shell would bounce
    // you to the setup wizard the moment you navigated away from this page.
    if (!model.trim()) {
      toast.error("Choose a model first.", {
        description: "Refresh models, then pick one from the list.",
      });
      return;
    }
    update({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      temperature,
      maxTokens,
    });
    toast.success("Settings saved");
  }

  return (
    <SectionCard
      title="AI provider"
      description="Your key is stored in this browser and sent, per request, only to the provider you choose. It is never written to disk and never logged."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="settings-provider">Provider</Label>
          <Select
            value={provider ?? undefined}
            onValueChange={(value) => handleProviderChange(value as Provider)}
          >
            <SelectTrigger id="settings-provider" className="w-full">
              <SelectValue placeholder="Choose a provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {PROVIDER_META[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ApiKeyInput id="settings-api-key" value={apiKey} onChange={handleApiKeyChange} />

        <div className="space-y-2">
          <Label htmlFor="settings-model">Model</Label>
          <ModelPicker
            id="settings-model"
            models={models}
            value={model}
            onChange={setModel}
            loading={modelsLoading}
            disabled={!provider || !apiKey.trim()}
            placeholder={model || "Press “Refresh models” to load the list"}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={validateStatus === "pending"}
          >
            {validateStatus === "pending" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Test connection
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefreshModels}
            disabled={modelsLoading}
          >
            {modelsLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Refresh models
          </Button>
        </div>

        {validateStatus === "success" ? (
          <p className="text-brand-strong flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
            Key verified — {modelCount} model{modelCount === 1 ? "" : "s"} available.
          </p>
        ) : null}
        {validateStatus === "error" ? (
          <p className="text-destructive flex items-center gap-1.5 text-xs">
            <XCircle className="size-3.5 shrink-0" aria-hidden />
            {validateError}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-temperature">Temperature</Label>
              <span className="tabular type-caption text-xs">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              id="settings-temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-max-tokens">Max tokens</Label>
            <Input
              id="settings-max-tokens"
              type="number"
              inputMode="numeric"
              min={MIN_TOKENS}
              max={MAX_TOKENS}
              step={1}
              value={maxTokens}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) setMaxTokens(next);
              }}
              onBlur={() =>
                setMaxTokens((current) => clamp(current, MIN_TOKENS, MAX_TOKENS))
              }
            />
            <p className="type-caption text-xs">
              Between {MIN_TOKENS.toLocaleString()} and {MAX_TOKENS.toLocaleString()}.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave}>
            Save settings
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
