/** Parses a positive bigint-safe generation id from a route param. */
export function parseGenerationIdParam(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}
