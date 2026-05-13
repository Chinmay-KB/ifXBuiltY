/** `sizes` strings for `next/image` — tuned to layout, not raw file pixels. */

export const GENERATION_CARD_IMAGE_SIZES =
  "(max-width: 479px) 50vw, (max-width: 640px) 33vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 320px";

export const FEED_TILE_PREVIEW_SIZES =
  "(max-width: 640px) 88vw, (max-width: 1024px) 35vw, 252px";

export const WALL_CARD_IMAGE_SIZES = (cssWidthPx: number) =>
  `${Math.max(64, Math.round(cssWidthPx))}px`;

export const GENERATION_DETAIL_HERO_SIZES =
  "(max-width: 768px) 100vw, (max-width: 1280px) 85vw, 920px";

export const REMIX_SOURCE_THUMB_SIZES = "40px";
