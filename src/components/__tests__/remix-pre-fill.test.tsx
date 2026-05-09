import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { GeneratorForm } from "../generator-form";
import type { GenerationInputs } from "@/lib/ui/types";

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock useGenerate hook
vi.mock("@/hooks/use-generate", () => ({
  useGenerate: () => ({
    generate: vi.fn().mockResolvedValue(undefined),
    result: null,
    isLoading: false,
    error: null,
    reset: vi.fn(),
  }),
}));

/**
 * Feature: ui-redesign, Property 12: Remix pre-fill from source
 * Validates: Requirements 6.6, 7.1
 *
 * For any source generation with fields (builder, target, tone, screenType, region, extraDetails),
 * opening the remix flow SHALL pre-fill the form with the exact values from the source generation
 * for all six fields.
 */
describe("GeneratorForm - Property 12: Remix pre-fill from source", () => {
  // Constrained arbitraries matching the select option sets
  const toneArb = fc.constantFrom("satirical", "absurdly polished", "dead serious", "unhinged");
  const screenTypeArb = fc.constantFrom("mobile app", "desktop web", "kiosk");
  const regionArb = fc.constantFrom("global", "US", "EU", "Global south");

  // Arbitrary for free-text fields (builder, target, extraDetails)
  const textArb = fc.string({ minLength: 1, maxLength: 50 });

  // Arbitrary for a full GenerationInputs representing a source generation
  const generationInputsArb: fc.Arbitrary<GenerationInputs> = fc.record({
    builder: textArb,
    target: textArb,
    tone: toneArb,
    screenType: screenTypeArb,
    region: regionArb,
    extraDetails: fc.string({ minLength: 0, maxLength: 100 }),
  });

  it("should pre-fill all six form fields with exact values from source generation", () => {
    fc.assert(
      fc.property(generationInputsArb, (sourceInputs) => {
        const { container } = render(
          <GeneratorForm
            signedIn={true}
            initialValues={sourceInputs}
            remixSource={{
              id: 1,
              label: `if ${sourceInputs.builder} built ${sourceInputs.target}`,
              imageUrl: null,
            }}
            onGenerated={vi.fn()}
          />
        );

        // Verify builder field
        const builderInput = screen.getByLabelText(/builder/i) as HTMLInputElement;
        expect(builderInput.value).toBe(sourceInputs.builder);

        // Verify target field
        const targetInput = screen.getByLabelText(/target/i) as HTMLInputElement;
        expect(targetInput.value).toBe(sourceInputs.target);

        // Verify tone select
        const toneSelect = screen.getByLabelText(/tone/i) as HTMLSelectElement;
        expect(toneSelect.value).toBe(sourceInputs.tone);

        // Verify screenType select
        const screenTypeSelect = screen.getByLabelText(/screen type/i) as HTMLSelectElement;
        expect(screenTypeSelect.value).toBe(sourceInputs.screenType);

        // Verify region select
        const regionSelect = screen.getByLabelText(/region/i) as HTMLSelectElement;
        expect(regionSelect.value).toBe(sourceInputs.region);

        // Verify extraDetails textarea
        const extraDetailsTextarea = screen.getByLabelText(/extra details/i) as HTMLTextAreaElement;
        expect(extraDetailsTextarea.value).toBe(sourceInputs.extraDetails);

        // Clean up for next iteration
        container.remove();
      }),
      { numRuns: 100 }
    );
  });
});
