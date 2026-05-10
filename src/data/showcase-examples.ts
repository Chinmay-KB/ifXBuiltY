import { generationMediaPath } from "@/lib/generation-media-url";

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
   * When set, hero/showcase uses stable same-origin media (`/api/generations/.../media?variant=detail`).
   * Pair with a matching `imageSrc` fallback for offline/dev before publish if desired.
   */
  generationSlug?: string;
};

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = raw;

/** Resolved URL for img tags — prefers cached media endpoint when `generationSlug` is set */
export function showcaseImageUrl(ex: ShowcaseExample): string {
  const slug = ex.generationSlug?.trim();
  if (slug) {
    return generationMediaPath(slug, "detail");
  }
  return ex.imageSrc;
}
