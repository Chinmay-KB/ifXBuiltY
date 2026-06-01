import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { GeneratorForm } from "../generator-form";
import { buildGeneratorProfileGroups } from "@/data/generator-profile-options";
import companyProfilesJson from "@/data/company-profiles.json";
import type { CompanyGroup } from "@/data/company-profiles";

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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/components/image-zoom", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockOpenSignIn = vi.fn();
vi.mock("@/components/sign-in-modal-provider", () => ({
  useSignInModal: () => ({ openSignIn: mockOpenSignIn }),
}));

const mockGenerate = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();

let mockResult: null | { id: number; slug: string; imageUrl: string | null; builder: string; target: string } = null;
let mockError: string | null = null;
let mockErrorCode: string | null = null;
let mockIsLoading = false;

vi.mock("@/hooks/use-generate", () => ({
  useGenerate: () => ({
    generate: mockGenerate,
    cancelInflight: vi.fn(),
    result: mockResult,
    isLoading: mockIsLoading,
    error: mockError,
    errorCode: mockErrorCode,
    reset: mockReset,
  }),
}));

function mockProfileGroups() {
  const companies = (companyProfilesJson as { id: string; name: string; products?: { id: string; name: string; screenType?: string }[] }[]).slice(0, 3);
  const groups: CompanyGroup[] = companies.map((c) => ({
    company: {
      id: c.id,
      name: c.name,
      styleDna: {
        tone: [],
        colors: [],
        visual_traits: [],
        ux_traits: [],
        meme_exaggeration: [],
        iconic_elements: [],
        behavioral_stereotypes: [],
        satirical_patterns: [],
      },
      archetype: { type: "", sections: [], layout: "desktop web", content_style: [] },
      logoPath: null,
      defaultVibeTags: [],
      parentCompanyId: null,
      profileType: "company",
      category: "search",
      popularityTier: 1,
      researchStatus: "approved",
      memeStrength: 3,
    },
    products: (c.products ?? []).slice(0, 2).map((p) => ({
      id: p.id,
      name: p.name,
      styleDna: {
        tone: [],
        colors: [],
        visual_traits: [],
        ux_traits: [],
        meme_exaggeration: [],
        iconic_elements: [],
        behavioral_stereotypes: [],
        satirical_patterns: [],
      },
      archetype: {
        type: "",
        sections: [],
        layout: p.screenType ?? "desktop web",
        content_style: [],
      },
      logoPath: null,
      defaultVibeTags: [],
      parentCompanyId: c.id,
      profileType: "product" as const,
      category: "search",
      popularityTier: 1,
      researchStatus: "approved",
      memeStrength: 3,
    })),
  }));
  return buildGeneratorProfileGroups(groups);
}

describe("GeneratorForm", () => {
  const profileGroups = mockProfileGroups();
  const defaultProps = {
    signedIn: true,
    profileGroups,
    onGenerated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = null;
    mockError = null;
    mockErrorCode = null;
    mockIsLoading = false;
  });

  it("renders builder and target pickers", () => {
    render(<GeneratorForm {...defaultProps} />);
    expect(screen.getByLabelText(/builder/i)).toBeDefined();
    expect(screen.getByLabelText(/target/i)).toBeDefined();
  });

  it("renders extra details textarea", () => {
    render(<GeneratorForm {...defaultProps} />);
    expect(screen.getByLabelText(/extra details/i)).toBeDefined();
  });

  it("disables Generate button when builder and target are empty", () => {
    render(<GeneratorForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("enables Generate button when both builder and target have values", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Google",
          target: "YouTube",
          builderId: "google",
          targetId: "google-youtube",
        }}
      />,
    );
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("shows sign-in prompt when not authenticated", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    expect(screen.getByRole("button", { name: /sign in to generate/i })).toBeDefined();
  });

  it("opens the sign-in modal from the unauthenticated prompt", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    fireEvent.click(screen.getByRole("button", { name: /sign in to generate/i }));
    expect(mockOpenSignIn).toHaveBeenCalledOnce();
  });

  it("opens the sign-in modal from the paper variant prompt", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} variant="paper" />);
    fireEvent.click(screen.getByRole("button", { name: /sign in to generate/i }));
    expect(mockOpenSignIn).toHaveBeenCalledOnce();
  });

  it("does not show Generate button when not signed in", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    expect(screen.queryByRole("button", { name: /^generate$/i })).toBeNull();
  });

  it("pre-fills builder and target from initialValues", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Google",
          target: "YouTube",
          builderId: "google",
          targetId: "google-youtube",
          extraDetails: "Make it corporate",
        }}
      />,
    );
    const builderBtn = screen.getByLabelText(/builder/i);
    expect(within(builderBtn).getByText("Google")).toBeDefined();
    expect((screen.getByLabelText(/extra details/i) as HTMLTextAreaElement).value).toBe(
      "Make it corporate",
    );
  });

  it("shows empty placeholder when no selection", () => {
    render(<GeneratorForm {...defaultProps} />);
    expect(screen.getAllByText(/select company or product/i).length).toBeGreaterThan(0);
  });

  it("passes remix parent id while keeping remix UI hidden", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Google",
          target: "YouTube",
          builderId: "google",
          targetId: "google-youtube",
        }}
        remixSource={{
          id: 42,
          label: "if Duolingo built airport security",
          imageUrl: "https://example.com/img.png",
        }}
      />,
    );
    expect(screen.queryByText("Remixing from")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));
    expect(mockGenerate).toHaveBeenCalledWith(expect.anything(), { remixParentId: 42 });
  });

  it("opens picker and selects a product", () => {
    render(<GeneratorForm {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/builder/i));
    expect(screen.getByRole("dialog")).toBeDefined();
    const youtube = screen.getAllByText("YouTube")[0]!;
    fireEvent.click(youtube);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByLabelText(/builder/i).textContent).toMatch(/YouTube/i);
  });

  it("calls generate with form values on submit", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Google",
          target: "YouTube",
          builderId: "google",
          targetId: "google-youtube",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        builder: "Google",
        target: "YouTube",
        builderId: "google",
        targetId: "google-youtube",
        extraDetails: "",
        screenType: "desktop",
      }),
      undefined,
    );
  });

  it("displays error message when error is present", () => {
    mockError = "Generation failed (500)";
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Google",
          target: "YouTube",
          builderId: "google",
          targetId: "google-youtube",
        }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe("Generation failed (500)");
  });
});
