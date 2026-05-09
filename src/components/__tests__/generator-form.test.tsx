import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GeneratorForm } from "../generator-form";

// Mock next/link
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
const mockGenerate = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();

let mockResult: null | { id: number; slug: string; imageUrl: string | null; builder: string; target: string } = null;
let mockError: string | null = null;
let mockIsLoading = false;

vi.mock("@/hooks/use-generate", () => ({
  useGenerate: () => ({
    generate: mockGenerate,
    result: mockResult,
    isLoading: mockIsLoading,
    error: mockError,
    reset: mockReset,
  }),
}));

describe("GeneratorForm", () => {
  const defaultProps = {
    signedIn: true,
    onGenerated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = null;
    mockError = null;
    mockIsLoading = false;
  });

  it("renders builder and target inputs", () => {
    render(<GeneratorForm {...defaultProps} />);
    const builderInput = screen.getByLabelText(/builder/i);
    const targetInput = screen.getByLabelText(/target/i);
    expect(builderInput).toBeDefined();
    expect(targetInput).toBeDefined();
  });

  it("renders secondary controls (tone, screen type, region, extra details)", () => {
    render(<GeneratorForm {...defaultProps} />);
    expect(screen.getByLabelText(/tone/i)).toBeDefined();
    expect(screen.getByLabelText(/screen type/i)).toBeDefined();
    expect(screen.getByLabelText(/region/i)).toBeDefined();
    expect(screen.getByLabelText(/extra details/i)).toBeDefined();
  });

  it("disables Generate button when builder and target are empty", () => {
    render(<GeneratorForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("disables Generate button when builder is whitespace-only", () => {
    render(
      <GeneratorForm {...defaultProps} initialValues={{ builder: "   ", target: "test" }} />
    );
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("enables Generate button when both builder and target have non-whitespace text", () => {
    render(
      <GeneratorForm {...defaultProps} initialValues={{ builder: "Apple", target: "taxes" }} />
    );
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("shows sign-in prompt when not authenticated", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    const link = screen.getByRole("link", { name: /sign in to generate/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/login");
  });

  it("does not show Generate button when not signed in", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    expect(screen.queryByRole("button", { name: /generate/i })).toBeNull();
  });

  it("pre-fills form fields from initialValues", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Spotify",
          target: "dental clinic",
          tone: "dead serious",
          screenType: "desktop web",
          region: "EU",
          extraDetails: "Make it corporate",
        }}
      />
    );
    expect((screen.getByLabelText(/builder/i) as HTMLInputElement).value).toBe("Spotify");
    expect((screen.getByLabelText(/target/i) as HTMLInputElement).value).toBe("dental clinic");
    expect((screen.getByLabelText(/tone/i) as HTMLSelectElement).value).toBe("dead serious");
    expect((screen.getByLabelText(/screen type/i) as HTMLSelectElement).value).toBe("desktop web");
    expect((screen.getByLabelText(/region/i) as HTMLSelectElement).value).toBe("EU");
    expect((screen.getByLabelText(/extra details/i) as HTMLTextAreaElement).value).toBe("Make it corporate");
  });

  it("uses default values when no initialValues provided", () => {
    render(<GeneratorForm {...defaultProps} />);
    expect((screen.getByLabelText(/builder/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/target/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/tone/i) as HTMLSelectElement).value).toBe("satirical");
    expect((screen.getByLabelText(/screen type/i) as HTMLSelectElement).value).toBe("mobile app");
    expect((screen.getByLabelText(/region/i) as HTMLSelectElement).value).toBe("global");
    expect((screen.getByLabelText(/extra details/i) as HTMLTextAreaElement).value).toBe("");
  });

  it("displays remix attribution strip when remixSource is provided", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        remixSource={{
          id: 42,
          label: "if Duolingo built airport security",
          imageUrl: "https://example.com/img.png",
        }}
      />
    );
    expect(screen.getByText("Remixing from")).toBeDefined();
    expect(screen.getByText("if Duolingo built airport security")).toBeDefined();
  });

  it("does not display remix strip when remixSource is null", () => {
    render(<GeneratorForm {...defaultProps} remixSource={null} />);
    expect(screen.queryByText("Remixing from")).toBeNull();
  });

  it("calls generate with form values on submit", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{ builder: "Apple", target: "taxes" }}
      />
    );
    const button = screen.getByRole("button", { name: /generate/i });
    fireEvent.click(button);

    expect(mockGenerate).toHaveBeenCalledWith({
      builder: "Apple",
      target: "taxes",
      tone: "satirical",
      screenType: "mobile app",
      region: "global",
      extraDetails: "",
    }, undefined);
  });

  it("displays error message when error is present", () => {
    mockError = "Generation failed (500)";
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{ builder: "Apple", target: "taxes" }}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Generation failed (500)");
  });
});
