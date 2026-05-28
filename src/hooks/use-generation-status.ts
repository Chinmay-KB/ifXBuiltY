"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GenerationStatus } from "@/lib/generation/types";
import { isGenerationInProgress } from "@/lib/generation/types";

export type GenerationStatusPayload = {
  id: number;
  slug: string;
  status: GenerationStatus;
  builder: string;
  target: string;
  errorMessage: string | null;
  imageUrl: string | null;
  imageDownloadUrl: string | null;
};

type UseGenerationStatusOptions = {
  generationId: number;
  initial?: GenerationStatusPayload | null;
  enabled?: boolean;
  pollIntervalMs?: number;
  onCompleted?: (payload: GenerationStatusPayload) => void;
  onFailed?: (payload: GenerationStatusPayload) => void;
};

function pollIntervalForStatus(
  status: GenerationStatus | undefined,
  overrideMs: number | undefined,
): number {
  if (overrideMs != null) return overrideMs;
  if (status === "queued") return 1500;
  if (status === "processing") return 3500;
  return 2500;
}

export function useGenerationStatus({
  generationId,
  initial = null,
  enabled = true,
  pollIntervalMs,
  onCompleted,
  onFailed,
}: UseGenerationStatusOptions) {
  const [data, setData] = useState<GenerationStatusPayload | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const completedRef = useRef(false);
  const inFlightRef = useRef(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchStatus = useCallback(async () => {
    const res = await fetch(`/api/generations/${generationId}/status`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error || `Status failed (${res.status})`,
      );
    }
    return (await res.json()) as GenerationStatusPayload;
  }, [generationId]);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return dataRef.current;
    inFlightRef.current = true;
    setIsPolling(true);
    try {
      const payload = await fetchStatus();
      setData(payload);
      setError(null);

      if (payload.status === "completed" && !completedRef.current) {
        completedRef.current = true;
        onCompleted?.(payload);
      }
      if (payload.status === "failed") {
        onFailed?.(payload);
      }
      return payload;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load status";
      setError(msg);
      return null;
    } finally {
      inFlightRef.current = false;
      setIsPolling(false);
    }
  }, [fetchStatus, onCompleted, onFailed]);

  useEffect(() => {
    if (!enabled || !generationId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = (delayMs: number) => {
      if (cancelled) return;
      timer = setTimeout(() => {
        void tick();
      }, delayMs);
    };

    const tick = async () => {
      const payload = await refresh();
      if (cancelled) return;
      if (payload && !isGenerationInProgress(payload.status)) {
        return;
      }
      scheduleNext(pollIntervalForStatus(payload?.status, pollIntervalMs));
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, generationId, pollIntervalMs, refresh]);

  return { data, error, isPolling, refresh };
}
