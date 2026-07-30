"use client";

import { useCallback, useState } from "react";

import { ApiError, providerApi } from "@/lib/api-client";
import type { AiModel, Provider } from "@/types";

interface ModelCatalogState {
  models: AiModel[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a provider's live model catalogue.
 *
 * Shared by the setup wizard's model step and the settings page's
 * "Refresh models" button, so there is exactly one place that calls
 * `providerApi.models`.
 */
export function useModelCatalog() {
  const [state, setState] = useState<ModelCatalogState>({
    models: [],
    loading: false,
    error: null,
  });

  const fetchModels = useCallback(async (provider: Provider, apiKey: string) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const models = await providerApi.models(provider, apiKey);
      setState({ models, loading: false, error: null });
      return models;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Couldn't load models.";
      setState({ models: [], loading: false, error: message });
      throw error;
    }
  }, []);

  const setModels = useCallback((models: AiModel[]) => {
    setState({ models, loading: false, error: null });
  }, []);

  return { ...state, fetchModels, setModels };
}
