import type { Sharp } from "sharp";

import type { GenerationMediaVariant } from "@/lib/generation-media-url";

export const CARD_CROP_DESKTOP = { width: 560, height: 320 } as const;
export const CARD_CROP_MOBILE = { width: 560, height: 560 } as const;

type DisplayVariant = Exclude<GenerationMediaVariant, "full">;

export function cardCropForAspect(
  width: number,
  height: number,
): typeof CARD_CROP_DESKTOP | typeof CARD_CROP_MOBILE {
  return height >= width ? CARD_CROP_MOBILE : CARD_CROP_DESKTOP;
}

export function contentTypeForDisplayVariant(variant: DisplayVariant): string {
  return variant === "og" ? "image/jpeg" : "image/webp";
}

export async function renderDisplayVariant(
  base: Sharp,
  variant: DisplayVariant,
  imageSize: { width: number; height: number },
): Promise<Buffer> {
  switch (variant) {
    case "card": {
      const crop = cardCropForAspect(imageSize.width, imageSize.height);
      return base
        .clone()
        .resize({
          width: crop.width,
          height: crop.height,
          fit: "cover",
          position: "top",
        })
        .webp({ quality: 82 })
        .toBuffer();
    }
    case "detail":
      return base
        .clone()
        .resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    case "og":
      return base
        .clone()
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}
