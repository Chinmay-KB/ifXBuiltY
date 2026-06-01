import { describe, expect, it } from "vitest";

import {
  parseCommaSeparated,
  parseFeedLimit,
  parseFeedOffset,
  parseFeedSort,
  parseFeedUrlParams,
} from "@/lib/feed-url-params";

describe("feed-url-params", () => {
  it("parses sort, lists, limit, and offset consistently", () => {
    expect(parseFeedSort("trending")).toBe("trending");
    expect(parseFeedSort(null)).toBe("newest");
    expect(parseCommaSeparated("a, b ,c")).toEqual(["a", "b", "c"]);
    expect(parseFeedLimit("999")).toBe(50);
    expect(parseFeedOffset("-1")).toBe(0);

    const params = parseFeedUrlParams(
      new URLSearchParams("sort=top&builder=Duolingo&target=IKEA&tone=chaos&limit=12&offset=3"),
    );
    expect(params.sort).toBe("top");
    expect(params.builders).toEqual(["Duolingo"]);
    expect(params.targets).toEqual(["IKEA"]);
    expect(params.tones).toEqual(["chaos"]);
  });
});
