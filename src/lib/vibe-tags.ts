/**
 * Canonical vibe tag vocabulary for feed filtering.
 * This file has zero app imports so it can be used in both server and client code.
 */

export const VIBE_TAGS = [
  "Chaotic",
  "Scammy",
  "Premium",
  "Wholesome",
  "Bureaucratic",
  "Cursed",
] as const satisfies readonly string[];

const vibeTagSet = new Set<string>(VIBE_TAGS);

/** Returns true if `s` is a valid vibe tag (case-sensitive). */
export function isVibeTag(s: string): boolean {
  return vibeTagSet.has(s);
}

/** Filters input to only valid tags and removes duplicates. */
export function sanitizeVibeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    if (isVibeTag(tag) && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }
  return result;
}
