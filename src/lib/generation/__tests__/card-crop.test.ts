import { describe, expect, it } from "vitest";

import {
  CARD_CROP_DESKTOP,
  CARD_CROP_MOBILE,
  cardCropForAspect,
} from "@/lib/generation/render-display-variants";

describe("cardCropForAspect", () => {
  it("uses 560×320 (7:4) for landscape desktop gens", () => {
    expect(cardCropForAspect(1792, 1024)).toEqual(CARD_CROP_DESKTOP);
    expect(CARD_CROP_DESKTOP.width / CARD_CROP_DESKTOP.height).toBeCloseTo(7 / 4);
  });

  it("uses 560×560 and top-weighted square for portrait or square gens", () => {
    expect(cardCropForAspect(1024, 1792)).toEqual(CARD_CROP_MOBILE);
    expect(cardCropForAspect(1024, 1024)).toEqual(CARD_CROP_MOBILE);
  });
});
