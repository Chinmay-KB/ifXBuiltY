import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { GeneratorForm } from "../generator-form";
import type { GenerationInputs } from "@/lib/ui/types";
import { FLAT_OPTIONS } from "@/data/generator-options";

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

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/components/image-zoom", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock sign-in modal provider
vi.mock("@/components/sign-in-modal-provider", () => ({
  useSignInModal: () => ({ openSignIn: vi.fn() }),
}));

// Mock useGenerate hook
vi.mock("@/hooks/use-generate", () => ({
  useGenerate: () => ({
    generate: vi.fn().mockResolvedValue(undefined),
    result: null,
    isLoading: false,
    error: null,
    errorCode: null,
    reset: vi.fn(),
  }),
}));

/**
 * Feature: ui-redesign, Property 12: Remix pre-fill from source
 * Validates: Requirements 6.6, 7.1
 *
 * For any source generation with fields (builder, target, extraDetails),
 * opening the remix flow SHALL pre-fill the form with the exact values from the source generation
 * for the visible form fields (builder select, target select, extra details textarea).
 */
describe("GeneratorForm - Property 12: Remix pre-fill from source", () => {
  // Constrained arbitraries matching the actual select option values
  const builderArb = fc.constantFrom(...FLAT_OPTIONS.map((b) => b.id));
  const targetArb = fc.constantFrom(...FLAT_OPTIONS.map((t) => t.id));

  // Arbitrary for extra details (free text)
  const extraDetailsArb = fc.string({ minLength: 0, maxLength: 100 });

  it("should pre-fill builder, target, and extra details with exact values from source generation", () => {
    fc.assert(
      fc.property(builderArb, targetArb, extraDetailsArb, (builderId, targetId, extraDetails) => {
        const builderOpt = FLAT_OPTIONS.find((o) => o.id === builderId)!;
        const targetOpt = FLAT_OPTIONS.find((o) => o.id === targetId)!;
        const sourceInputs: GenerationInputs = {
          builder: builderOpt.name,
          target: targetOpt.name,
          builderId,
          targetId,
          extraDetails,
        };

        const { container } = render(
          <GeneratorForm
            signedIn={true}
            initialValues={sourceInputs}
            remixSource={{
              id: 1,
              label: `if ${builderOpt.name} built ${targetOpt.name}`,
              imageUrl: null,
            }}
            onGenerated={vi.fn()}
          />
        );

        const builderInput = screen.getByLabelText(/builder/i);
        expect(builderInput.textContent).toContain(
          builderOpt.name.includes(" — ")
            ? builderOpt.name.split(" — ").pop()!
            : builderOpt.name,
        );

        const targetInput = screen.getByLabelText(/target/i);
        expect(targetInput.textContent).toContain(
          targetOpt.name.includes(" — ")
            ? targetOpt.name.split(" — ").pop()!
            : targetOpt.name,
        );

        // Verify extraDetails textarea
        const extraDetailsTextarea = screen.getByLabelText(/extra details/i) as HTMLTextAreaElement;
        expect(extraDetailsTextarea.value).toBe(extraDetails);

        // Clean up for next iteration
        container.remove();
      }),
      { numRuns: 100 }
    );
  });
});
