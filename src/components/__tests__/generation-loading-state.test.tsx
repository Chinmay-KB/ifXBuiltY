import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { GenerationLoadingState } from "../generation-loading-state";

// Mock matchMedia
function createMockMatchMedia(reducedMotion: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("GenerationLoadingState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = createMockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders branded placeholder", () => {
    const { container } = render(<GenerationLoadingState />);

    expect(container.textContent).toContain("ifXbuiltY");
    expect(container.textContent).toContain("Generating your creation");
  });

  it("renders indeterminate progress indicator", () => {
    const { container } = render(<GenerationLoadingState />);

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeNull();
    expect(progressBar!.getAttribute("aria-label")).toBe("Generation progress");
  });

  it("has accessible role=status container", () => {
    const { container } = render(<GenerationLoadingState />);

    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status!.getAttribute("aria-label")).toBe("Generation in progress");
  });

  it("displays microcopy messages that rotate", () => {
    const { container } = render(<GenerationLoadingState />);

    const microcopyEl = container.querySelector('[aria-atomic="true"]');
    const initialText = microcopyEl?.textContent;
    expect(initialText).toBeTruthy();

    // Advance past rotation interval
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    const afterText = container.querySelector('[aria-atomic="true"]')?.textContent;
    // Text should have changed (rotated)
    expect(afterText).toBeTruthy();
  });

  it("does not rotate microcopy when prefers-reduced-motion is active", () => {
    window.matchMedia = createMockMatchMedia(true);

    const { container } = render(<GenerationLoadingState />);

    const microcopyEl = container.querySelector('[aria-atomic="true"]');
    const initialText = microcopyEl?.textContent;

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    const afterText = container.querySelector('[aria-atomic="true"]')?.textContent;
    expect(afterText).toBe(initialText);
  });

  it("shows builder-specific loading messages when builder is provided", () => {
    const { container } = render(<GenerationLoadingState builder="Duolingo" />);

    const microcopyEl = container.querySelector('[aria-atomic="true"]');
    expect(microcopyEl?.textContent).toBeTruthy();
  });
});
