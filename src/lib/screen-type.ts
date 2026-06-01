import type { CompanyProfile } from "@/data/company-profiles";

/** Canonical render modes for image generation. */
export const RENDER_MODE_OPTIONS = ["mobile", "desktop"] as const;

export type RenderMode = (typeof RENDER_MODE_OPTIONS)[number];

/** @deprecated Use `RENDER_MODE_OPTIONS` — kept for existing imports. */
export const SCREEN_TYPE_OPTIONS = RENDER_MODE_OPTIONS;

/** @deprecated Use `RenderMode` */
export type ScreenTypeOption = RenderMode;

const LEGACY_ALIASES = new Set([
  "mobile",
  "mobile app",
  "desktop",
  "desktop web",
  "desktop app",
  "web",
  "tablet",
  "tv",
  "kiosk",
]);

export function isKnownScreenType(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    RENDER_MODE_OPTIONS.includes(v as RenderMode) || LEGACY_ALIASES.has(v)
  );
}

/**
 * Collapse legacy granular screen types into mobile (9:16) or desktop (16:9).
 */
export function normalizeRenderMode(
  value: string | undefined | null,
): RenderMode {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "mobile" || v === "mobile app") return "mobile";
  if (
    v === "desktop" ||
    v === "desktop web" ||
    v === "desktop app" ||
    v === "web" ||
    v === "tablet" ||
    v === "tv" ||
    v === "kiosk"
  ) {
    return "desktop";
  }
  return "desktop";
}

/** @deprecated Use `normalizeRenderMode` */
export const normalizeScreenType = normalizeRenderMode;

export function resolveProfileScreenType(profile: CompanyProfile): RenderMode {
  const layout = profile.archetype?.layout?.trim() ?? "";
  if (layout && isKnownScreenType(layout)) {
    return normalizeRenderMode(layout);
  }
  return "desktop";
}

/** Provider image size closest to 9:16 (mobile) or 16:9 (desktop). */
export function getGenerationImageSize(
  mode: RenderMode,
): `${number}x${number}` {
  switch (mode) {
    case "mobile":
      return "1024x1792";
    case "desktop":
      return "1792x1024";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/** Tailwind aspect ratio class for feed/detail frames. */
export function getDisplayAspectClass(mode: string): string {
  return normalizeRenderMode(mode) === "mobile"
    ? "aspect-[9/16]"
    : "aspect-video";
}

export function formatScreenBadge(screenType: string): string {
  return normalizeRenderMode(screenType) === "mobile" ? "Mobile" : "Desktop";
}

export function formatScreenLabel(screenType: string): string {
  return normalizeRenderMode(screenType) === "mobile" ? "Mobile" : "Desktop";
}

/** Explicit framing instructions for the image model prompt. */
export function screenTypePromptFragment(mode: RenderMode): string {
  switch (mode) {
    case "mobile":
      return "Render as a 9:16 vertical mobile phone UI mockup in portrait orientation — full-screen phone frame, status bar area, thumb-reachable controls, no letterboxing.";
    case "desktop":
      return "Render as a 16:9 widescreen desktop browser UI mockup in landscape orientation — browser chrome, wide layout, desktop interaction patterns, no letterboxing.";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
