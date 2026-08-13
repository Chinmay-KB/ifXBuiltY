type SlugInput = {
  builder: string;
  target: string;
};

/** Short URL-safe slug segment from builder + target (unique suffix may be appended by caller). */
export function makeGenerationSlugSnippet(input: SlugInput): string {
  const combined = `${input.builder} ${input.target}`.toLowerCase();
  const slug = combined
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "generation";
}

/**
 * True when `candidate` is the same slug or a numeric uniqueness suffix
 * (`microsoft-teams-tinder-1`) of `requested`.
 */
export function isNumericSlugAlias(
  requested: string,
  candidate: string,
): boolean {
  if (candidate === requested) return true;
  const prefix = `${requested}-`;
  if (!candidate.startsWith(prefix)) return false;
  return /^\d+$/.test(candidate.slice(prefix.length));
}
