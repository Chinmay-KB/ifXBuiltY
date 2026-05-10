export type GenerationMediaVariant = "card" | "detail" | "full";

/**
 * Stable same-origin URL for published generation images. Suitable for `img src`
 * and CDN/browser caching (Cache-Control set on the route handler).
 */
export function generationMediaPath(
  slug: string,
  variant: GenerationMediaVariant,
): string {
  const enc = encodeURIComponent(slug);
  return `/api/generations/${enc}/media?variant=${variant}`;
}

export function generationMediaAbsoluteUrl(
  origin: string,
  slug: string,
  variant: GenerationMediaVariant,
): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${generationMediaPath(slug, variant)}`;
}
