"use client";

import { CheckCircle2, Loader2, Lock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/shared/container";
import { LoadingState } from "@/components/shared/loading-state";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  ApiKeyInput,
  ModelPicker,
  ProviderCard,
  StepIndicator,
  useModelCatalog,
  useValidateKey,
} from "@/features/setup";
import { useSettings } from "@/hooks/use-settings";
import { PROVIDER_META } from "@/lib/constants";
import { PROVIDERS, type AiModel, type Provider } from "@/types";

const STEP_LABELS = ["Provider", "API key", "Validate", "Model", "Finish"];

/**
 * The setup wizard, a standalone full-page route (not inside the app shell).
 *
 * Progress is written to `useSettings()` as each step is confirmed — the
 * provider once chosen, the key once it validates, the model once picked —
 * so a refresh mid-flow re-hydrates the form instead of losing it.
 */
export default function SetupPage() {
  const router = useRouter();
  const { settings, update, hydrated } = useSettings();

  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [restored, setRestored] = useState(false);

  const { status: validateStatus, error: validateError, modelCount, validate, reset: resetValidate } =
    useValidateKey();
  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    fetchModels,
    setModels,
  } = useModelCatalog();

  const validatedKeyRef = useRef<string>("");

  // Restore progress once localStorage is readable — never before, or the
  // server-rendered step-1 markup wouldn't match the client's first paint.
  useEffect(() => {
    if (!hydrated || restored) return;
    if (settings.provider) setProvider(settings.provider);
    if (settings.apiKey) setApiKey(settings.apiKey);
    if (settings.model) setModel(settings.model);

    if (settings.provider && settings.apiKey && settings.model) setStep(5);
    else if (settings.provider && settings.apiKey) setStep(3);
    else if (settings.provider) setStep(2);

    setRestored(true);
  }, [hydrated, restored, settings.provider, settings.apiKey, settings.model]);

  // Auto-run validation on entering step 3, once per key.
  useEffect(() => {
    if (step !== 3 || !provider || !apiKey.trim()) return;
    if (validatedKeyRef.current === apiKey) return;
    validatedKeyRef.current = apiKey;
    void validate(provider, apiKey.trim());
  }, [step, provider, apiKey, validate]);

  if (!restored) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <LoadingState rows={3} label="Loading setup" className="w-72" />
      </main>
    );
  }

  function selectProvider(next: Provider) {
    if (next !== provider) {
      setApiKey("");
      setModel("");
      setModels([]);
      resetValidate();
      validatedKeyRef.current = "";
    }
    setProvider(next);
  }

  function changeApiKey(next: string) {
    setApiKey(next);
    setModel("");
    setModels([]);
    if (validateStatus !== "idle") resetValidate();
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function goNext() {
    if (step === 1 && provider) {
      update({ provider });
      setStep(2);
    } else if (step === 2 && apiKey.trim()) {
      setStep(3);
    } else if (step === 3 && validateStatus === "success") {
      update({ apiKey: apiKey.trim() });
      setStep(4);
    } else if (step === 4 && model) {
      update({ model });
      setStep(5);
    }
  }

  function retryValidate() {
    if (!provider) return;
    validatedKeyRef.current = "";
    void validate(provider, apiKey.trim()).then(() => {
      validatedKeyRef.current = apiKey;
    });
  }

  async function loadModels() {
    if (!provider || !apiKey.trim()) return;
    try {
      await fetchModels(provider, apiKey.trim());
    } catch {
      // Surfaced inline via `modelsError`.
    }
  }

  function finishSetup() {
    if (!provider || !apiKey.trim() || !model) return;
    update({ provider, apiKey: apiKey.trim(), model, onboarded: true });
    toast.success("You're all set", { description: "Welcome to MindCareAI." });
    router.push("/app");
  }

  const canAdvance =
    (step === 1 && provider !== null) ||
    (step === 2 && apiKey.trim().length > 0) ||
    (step === 3 && validateStatus === "success") ||
    (step === 4 && model !== "");

  return (
    <main className="aurora min-h-dvh">
      <Container width="content" className="flex min-h-dvh flex-col py-8 sm:py-10">
        <div className="flex items-center justify-between">
          <BrandMark />
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-xl flex-1 py-8 sm:py-12">
          <div className="animate-rise space-y-8">
            <div className="space-y-2 text-center">
              <p className="type-eyebrow">Setup</p>
              <h1 className="type-title text-balance">Connect an AI provider</h1>
              <p className="type-caption text-pretty">
                Bring your own key from OpenRouter, Groq or Google Gemini. It takes a couple
                of minutes.
              </p>
            </div>

            <StepIndicator steps={STEP_LABELS} current={step} />

            <div className="surface p-6 sm:p-8">
              {step === 1 ? (
                <StepProvider provider={provider} onSelect={selectProvider} />
              ) : null}

              {step === 2 && provider ? (
                <StepApiKey provider={provider} apiKey={apiKey} onChange={changeApiKey} />
              ) : null}

              {step === 3 && provider ? (
                <StepValidate
                  provider={provider}
                  status={validateStatus}
                  error={validateError}
                  modelCount={modelCount}
                  onRetry={retryValidate}
                  onEditKey={() => setStep(2)}
                />
              ) : null}

              {step === 4 && provider ? (
                <StepModel
                  models={models}
                  loading={modelsLoading}
                  error={modelsError}
                  model={model}
                  onChange={setModel}
                  onRetryFetch={loadModels}
                  fetchedOnce={models.length > 0 || modelsLoading}
                />
              ) : null}

              {step === 5 && provider ? (
                <StepFinish provider={provider} model={model} onFinish={finishSetup} />
              ) : null}
            </div>

            {step < 5 ? (
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1}>
                  Back
                </Button>
                <Button type="button" onClick={goNext} disabled={!canAdvance}>
                  Continue
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-start">
                <Button type="button" variant="ghost" onClick={goBack}>
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Steps                                    */
/* -------------------------------------------------------------------------- */

function StepProvider({
  provider,
  onSelect,
}: {
  provider: Provider | null;
  onSelect: (provider: Provider) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="type-heading">Choose a provider</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {PROVIDERS.map((value) => (
          <ProviderCard
            key={value}
            provider={value}
            selected={provider === value}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function StepApiKey({
  provider,
  apiKey,
  onChange,
}: {
  provider: Provider;
  apiKey: string;
  onChange: (value: string) => void;
}) {
  const meta = PROVIDER_META[provider];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-heading">Paste your {meta.label} key</h2>
        <p className="type-caption">
          Don&apos;t have one yet?{" "}
          <a
            href={meta.keyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary-strong font-medium hover:underline"
          >
            Get a key from {meta.label}
          </a>
          .
        </p>
      </div>
      <ApiKeyInput
        label={null}
        value={apiKey}
        onChange={onChange}
        placeholder={`${meta.keyPrefix}…`}
        autoFocus
      />
      <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Stored only in this browser&apos;s local storage. It is sent to {meta.label} and
        nowhere else.
      </p>
    </div>
  );
}

function StepValidate({
  provider,
  status,
  error,
  modelCount,
  onRetry,
  onEditKey,
}: {
  provider: Provider;
  status: "idle" | "pending" | "success" | "error";
  error: string | null;
  modelCount: number | null;
  onRetry: () => void;
  onEditKey: () => void;
}) {
  const meta = PROVIDER_META[provider];

  return (
    <div className="space-y-4">
      <h2 className="type-heading">Checking your key</h2>

      {status === "pending" || status === "idle" ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="text-primary size-5 shrink-0 animate-spin" aria-hidden />
          <p className="type-body">Checking your key with {meta.label}…</p>
        </div>
      ) : null}

      {status === "success" ? (
        <div className="bg-brand-muted flex items-start gap-3 rounded-lg p-4">
          <CheckCircle2 className="text-brand-strong mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="type-body font-medium">Key verified</p>
            <p className="type-caption">
              {modelCount ?? "Several"} model{modelCount === 1 ? "" : "s"} are available with
              this key. Continue to pick one.
            </p>
          </div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="space-y-4">
          <div className="bg-destructive/10 flex items-start gap-3 rounded-lg p-4">
            <XCircle className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="space-y-1">
              <p className="type-body font-medium">That key didn&apos;t work</p>
              <p className="type-caption text-pretty">{error}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onEditKey}>
              Edit key
            </Button>
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepModel({
  models,
  loading,
  error,
  model,
  onChange,
  onRetryFetch,
  fetchedOnce,
}: {
  models: AiModel[];
  loading: boolean;
  error: string | null;
  model: string;
  onChange: (id: string) => void;
  onRetryFetch: () => void;
  fetchedOnce: boolean;
}) {
  useEffect(() => {
    if (!fetchedOnce) onRetryFetch();
    // Only ever auto-fetch once, the first time this step is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-heading">Pick a model</h2>
        <p className="type-caption">
          Fetched live from the provider — search by name if the list is long.
        </p>
      </div>

      {error ? (
        <div className="bg-destructive/10 flex items-start gap-3 rounded-lg p-4">
          <XCircle className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex-1 space-y-2">
            <p className="type-caption text-pretty">{error}</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetryFetch}>
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <ModelPicker
          models={models}
          value={model}
          onChange={onChange}
          loading={loading}
          placeholder={loading ? "Fetching models…" : "No models found"}
        />
      )}
    </div>
  );
}

function StepFinish({
  provider,
  model,
  onFinish,
}: {
  provider: Provider;
  model: string;
  onFinish: () => void;
}) {
  const meta = PROVIDER_META[provider];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="type-heading">Ready to go</h2>
        <p className="type-caption">Everything below is saved only in this browser.</p>
      </div>
      <dl className="divide-border divide-y text-sm">
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-muted-foreground">Provider</dt>
          <dd className="font-medium">{meta.label}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground shrink-0">Model</dt>
          <dd className="truncate text-right font-medium">{model}</dd>
        </div>
      </dl>
      <Button type="button" variant="brand" size="xl" className="w-full" onClick={onFinish}>
        Enter MindCareAI
      </Button>
    </div>
  );
}
