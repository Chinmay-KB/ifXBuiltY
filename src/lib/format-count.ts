/** Compact positive counts for UI (e.g. 2800 → 2.8k). */
export function formatCompactCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const v = Math.round(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs < 1000) return `${sign}${abs}`;
  const k = abs / 1000;
  const t = k % 1 < 0.05 ? Math.round(k) : Number(k.toFixed(1));
  return `${sign}${t}k`;
}
