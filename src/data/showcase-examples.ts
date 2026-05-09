import raw from "./showcase-examples.json";

export type ShowcaseExample = {
  id: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  /** Static asset under `public/` or absolute path */
  imageSrc: string;
  /**
   * When set, hero/showcase uses stable `/api/generations/{slug}/image` (published-only).
   * (Dynamic route segment is named `id` in the app; value is the generation slug.)
   * Pair with a matching `imageSrc` fallback for offline/dev before publish if desired.
   */
  generationSlug?: string;
};

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = raw;

/** Resolved URL for img tags — prefers proxied storage URL when `generationSlug` is set */
export function showcaseImageUrl(ex: ShowcaseExample): string {
  const slug = ex.generationSlug?.trim();
  if (slug) {
    return `/api/generations/${encodeURIComponent(slug)}/image`;
  }
  return ex.imageSrc;
}
