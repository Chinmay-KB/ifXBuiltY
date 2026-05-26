type TimingFields = Record<string, number | string | boolean | null | undefined>;

/**
 * Structured duration logs for generation pipeline phases.
 * Enable with GENERATION_TIMING_LOGS=1 (default on in development).
 */
export function logGenerationTiming(
  phase: string,
  durationMs: number,
  fields?: TimingFields,
): void {
  const enabled =
    process.env.GENERATION_TIMING_LOGS === "1" ||
    process.env.NODE_ENV === "development";
  if (!enabled) return;

  const payload = {
    phase,
    durationMs: Math.round(durationMs),
    ...fields,
  };
  console.info("[generation-timing]", JSON.stringify(payload));
}

export async function withGenerationTiming<T>(
  phase: string,
  fn: () => Promise<T>,
  fields?: TimingFields,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    logGenerationTiming(phase, performance.now() - start, fields);
  }
}
