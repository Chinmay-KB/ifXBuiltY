import type { GenerationStatusPayload } from "@/hooks/use-generation-status";
import { isGenerationInProgress } from "@/lib/generation/types";

function pollDelayMs(status: GenerationStatusPayload["status"] | undefined): number {
  if (status === "queued") return 1500;
  if (status === "processing") return 3500;
  return 2500;
}

/**
 * Poll owner status until the generation completes or fails.
 */
export async function pollGenerationUntilDone(
  generationId: number,
  signal?: AbortSignal,
): Promise<GenerationStatusPayload> {
  for (;;) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const res = await fetch(`/api/generations/${generationId}/status`, { signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error || `Status failed (${res.status})`,
      );
    }

    const payload = (await res.json()) as GenerationStatusPayload;
    if (!isGenerationInProgress(payload.status)) {
      return payload;
    }

    await new Promise<void>((resolve, reject) => {
      const id = setTimeout(resolve, pollDelayMs(payload.status));
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(id);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  }
}
