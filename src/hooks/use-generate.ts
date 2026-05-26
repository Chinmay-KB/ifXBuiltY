"use client";

import { useState, useCallback, useRef } from "react";

import { saveActiveGenerationId } from "@/lib/generation/active-generation-storage";
import type { GenerationStatus } from "@/lib/generation/types";
import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

type UseGenerateReturn = {
  generate: (inputs: GenerationInputs, options?: { remixParentId?: number }) => Promise<GenerationResult | null>;
  /** Aborts the in-flight `/api/generate` request (no-op if idle). */
  cancelInflight: () => void;
  result: GenerationResult | null;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  reset: () => void;
};

/**
 * useGenerate — generation lifecycle hook.
 *
 * Starts a durable generation job and returns id/slug immediately (202).
 */
export function useGenerate(): UseGenerateReturn {
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const inflightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancelInflight = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const generate = useCallback(
    async (
      inputs: GenerationInputs,
      options?: { remixParentId?: number },
    ): Promise<GenerationResult | null> => {
      if (inflightRef.current) return null;

      inflightRef.current = true;
      const ac = new AbortController();
      abortRef.current = ac;
      setIsLoading(true);
      setError(null);
      setErrorCode(null);
      setResult(null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            ...inputs,
            ...(options?.remixParentId ? { remixParentId: options.remixParentId } : {}),
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const message =
            (body as { error?: string }).error || `Generation failed (${res.status})`;
          const code = (body as { code?: string }).code ?? null;
          setError(message);
          setErrorCode(code);
          return null;
        }

        const data = await res.json();
        const status = (data.status as GenerationStatus) ?? "queued";
        const next: GenerationResult = {
          id: data.id,
          slug: data.slug,
          imageUrl: null,
          builder: inputs.builder,
          target: inputs.target,
          status,
        };
        setResult(next);
        saveActiveGenerationId(data.id);
        return next;
      } catch (e) {
        const aborted =
          (e instanceof DOMException && e.name === "AbortError") ||
          (e instanceof Error && e.name === "AbortError");
        if (aborted) {
          setError(null);
          setErrorCode(null);
          return null;
        }
        setError("Network error. Please check your connection and try again.");
        return null;
      } finally {
        setIsLoading(false);
        inflightRef.current = false;
        abortRef.current = null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setErrorCode(null);
  }, []);

  return { generate, cancelInflight, result, isLoading, error, errorCode, reset };
}
