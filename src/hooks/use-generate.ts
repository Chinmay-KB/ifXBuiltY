"use client";

import { useState, useCallback, useRef } from "react";

import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

type UseGenerateReturn = {
  generate: (inputs: GenerationInputs, options?: { remixParentId?: number }) => Promise<void>;
  result: GenerationResult | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
};

/**
 * useGenerate — generation lifecycle hook.
 *
 * Manages the full lifecycle: submit → loading → result/error.
 * Preserves form inputs on error so the user can retry.
 * Prevents concurrent generation requests.
 */
export function useGenerate(): UseGenerateReturn {
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against concurrent requests
  const inflightRef = useRef(false);

  const generate = useCallback(async (inputs: GenerationInputs, options?: { remixParentId?: number }) => {
    // Prevent concurrent generation requests
    if (inflightRef.current) return;

    inflightRef.current = true;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inputs,
          ...(options?.remixParentId ? { remixParentId: options.remixParentId } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          (body as { error?: string }).error || `Generation failed (${res.status})`;
        setError(message);
        return;
      }

      const data = await res.json();
      setResult({
        id: data.id,
        slug: data.slug,
        imageUrl: data.imageUrl,
        builder: inputs.builder,
        target: inputs.target,
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      inflightRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { generate, result, isLoading, error, reset };
}
