import type { GenerationInputs } from "./types";

/**
 * Format a card label as "{builder} built {target}".
 * Truncated to 60 characters with trailing "…" if it exceeds that length.
 *
 * Validates: Requirements 3.2
 */
export function formatCardLabel(builder: string, target: string): string {
  const label = `${builder} built ${target}`;
  if (label.length <= 60) {
    return label;
  }
  return label.slice(0, 60) + "…";
}

/**
 * Format a number in compact form for display.
 * - Raw number as string when |n| < 1000
 * - "{X}k" format when |n| >= 1000 (one decimal when not whole thousands)
 * - Negative numbers prefixed with "−" (minus sign U+2212)
 *
 * Validates: Requirements 3.3
 */
export function formatCompactCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const v = Math.round(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs < 1000) return `${sign}${abs}`;
  const k = abs / 1000;
  const formatted = k % 1 < 0.05 ? Math.round(k) : Number(k.toFixed(1));
  return `${sign}${formatted}k`;
}

/**
 * Format the result title as "if {builder} built {target}".
 *
 * Validates: Requirements 6.3
 */
export function formatResultTitle(builder: string, target: string): string {
  return `if ${builder} built ${target}`;
}

/**
 * One-line OG/Twitter description. Keep it a joke, not a locker template.
 */
export function formatOgDescription(builder: string, target: string): string {
  return `What if ${builder} built ${target}? The UI is the punchline.`;
}

/**
 * Determine if the Generate action should be enabled.
 * Returns true iff both builder and target are non-empty after trimming.
 *
 * Validates: Requirements 4.3, 4.4
 */
export function isGenerateEnabled(builder: string, target: string): boolean {
  return builder.trim().length > 0 && target.trim().length > 0;
}

/**
 * Determine if any field in the current inputs differs from the last inputs.
 * Used to enable the "Regenerate" action after a successful generation.
 *
 * Validates: Requirements 6.8
 */
export function hasInputsChanged(
  current: GenerationInputs,
  last: GenerationInputs
): boolean {
  return (
    current.builder !== last.builder ||
    current.target !== last.target ||
    current.extraDetails !== last.extraDetails ||
    (current.tone ?? "") !== (last.tone ?? "")
  );
}
