import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { GenerationLoadingState } from "../generation-loading-state";
import type { ShowcaseExample } from "@/data/showcase-examples";

// Mock matchMedia
function createMockMatchMedia(reducedMotion: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function makeExamples(count: number): ShowcaseExample[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `example-${i}`,
    builder: `Builder ${i}`,
    target: `Target ${i}`,
    tone: "playful",
    screenType: "mobile",
    region: "global",
    extraDetails: "",
    imageSrc: `/showcase/0${i + 1}-example.svg`,
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

  it("renders showcase slideshow when examples are provided", () => {
    const examples = makeExamples(3);
    const { container } = render(
      <GenerationLoadingState showcaseExamples={examples} />
    );

    // Should render images from showcase examples
    const images = container.querySelectorAll("img");
    expect(images.length).toBe(2); // Two layers for cross-fade
    expect(images[0].getAttribute("src")).toBe(examples[0].imageSrc);
    expect(images[1].getAttribute("src")).toBe(examples[1].imageSrc);
  });

  it("renders static placeholder when no showcase examples", () => {
    const { container } = render(
      <GenerationLoadingState showcaseExamples={[]} />
    );

    // Should show branded placeholder
    expect(container.textContent).toContain("ifXbuiltY");
    expect(container.textContent).toContain("Generating your creation");

    // Should not render any images
    expect(container.querySelectorAll("img").length).toBe(0);
  });

  it("displays microcopy messages", () => {
    const { container } = render(
      <GenerationLoadingState showcaseExamples={makeExamples(2)} />
    );

    // First microcopy message should be visible
    expect(container.textContent).toContain("Overthinking the interface...");
  });

  it("rotates microcopy every 5 seconds", () => {
    const { container } = render(
      <GenerationLoadingState showcaseExamples={makeExamples(2)} />
    );

    expect(container.textContent).toContain("Overthinking the interface...");

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(container.textContent).toContain("Adding unnecessary gradients...");
  });

  it("renders indeterminate progress indicator", () => {
    const { container } = render(
      <GenerationLoadingState showcaseExamples={makeExamples(2)} />
    );

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeNull();
    expect(progressBar!.getAttribute("aria-label")).toBe("Generation progress");
  });

  it("has accessible role=status container", () => {
    const { container } = render(
      <GenerationLoadingState showcaseExamples={makeExamples(2)} />
    );

    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status!.getAttribute("aria-label")).toBe("Generation in progress");
  });

  it("disables auto-play when prefers-reduced-motion is active", () => {
    window.matchMedia = createMockMatchMedia(true);

    const { container } = render(
      <GenerationLoadingState showcaseExamples={makeExamples(3)} />
    );

    // Advance time — microcopy should NOT rotate
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should still show the first microcopy (no rotation)
    expect(container.textContent).toContain("Overthinking the interface...");
  });

  it("uses 0ms transitions when prefers-reduced-motion is active", () => {
    window.matchMedia = createMockMatchMedia(true);

    const { container } = render(
      <GenerationLoadingState showcaseExamples={makeExamples(3)} />
    );

    // Images should have duration-0 class
    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      expect(img.className).toContain("duration-0");
    });
  });

  it("rotates slideshow images every 5 seconds", () => {
    const examples = makeExamples(4);
    const { container } = render(
      <GenerationLoadingState showcaseExamples={examples} />
    );

    const images = container.querySelectorAll("img");

    // Initially: layer A visible (opacity-100), layer B hidden (opacity-0)
    expect(images[0].className).toContain("opacity-100");
    expect(images[1].className).toContain("opacity-0");

    // After 5s: should cross-fade to next
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const updatedImages = container.querySelectorAll("img");
    // After rotation, showNext should be true — layer B becomes visible
    expect(updatedImages[0].className).toContain("opacity-0");
    expect(updatedImages[1].className).toContain("opacity-100");
  });

  it("does not rotate slideshow with only one example", () => {
    const examples = makeExamples(1);
    const { container } = render(
      <GenerationLoadingState showcaseExamples={examples} />
    );

    const images = container.querySelectorAll("img");
    expect(images[0].getAttribute("src")).toBe(examples[0].imageSrc);

    // Advance time — should not crash or change
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    const updatedImages = container.querySelectorAll("img");
    expect(updatedImages[0].getAttribute("src")).toBe(examples[0].imageSrc);
  });

  it("does not rotate slideshow when prefers-reduced-motion is active", () => {
    window.matchMedia = createMockMatchMedia(true);

    const examples = makeExamples(4);
    const { container } = render(
      <GenerationLoadingState showcaseExamples={examples} />
    );

    const images = container.querySelectorAll("img");
    // Initially layer A visible
    expect(images[0].className).toContain("opacity-100");

    // Advance time — should NOT rotate
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    const updatedImages = container.querySelectorAll("img");
    // Still layer A visible (no rotation happened)
    expect(updatedImages[0].className).toContain("opacity-100");
    expect(updatedImages[1].className).toContain("opacity-0");
  });
});
