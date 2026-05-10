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

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// Mock sign-in modal provider
const mockOpenSignIn = vi.fn();
vi.mock("@/components/sign-in-modal-provider", () => ({
  useSignInModal: () => ({ openSignIn: mockOpenSignIn }),
}));

// Mock useGenerate hook
const mockGenerate = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();

let mockResult: null | { id: number; slug: string; imageUrl: string | null; builder: string; target: string } = null;
let mockError: string | null = null;
let mockErrorCode: string | null = null;
let mockIsLoading = false;

vi.mock("@/hooks/use-generate", () => ({
  useGenerate: () => ({
    generate: mockGenerate,
    result: mockResult,
    isLoading: mockIsLoading,
    error: mockError,
    errorCode: mockErrorCode,
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
    mockErrorCode = null;
    mockIsLoading = false;
  });

  it("renders builder and target inputs", () => {
    render(<GeneratorForm {...defaultProps} />);
    const builderInput = screen.getByLabelText(/builder/i);
    const targetInput = screen.getByLabelText(/target/i);
    expect(builderInput).toBeDefined();
    expect(targetInput).toBeDefined();
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
      <GeneratorForm {...defaultProps} initialValues={{ builder: "Apple", target: "LinkedIn" }} />
    );
    const button = screen.getByRole("button", { name: /generate/i });
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("shows sign-in prompt when not authenticated", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    const button = screen.getByRole("button", { name: /sign in to generate/i });
    expect(button).toBeDefined();
  });

  it("does not show Generate button when not signed in", () => {
    render(<GeneratorForm {...defaultProps} signedIn={false} />);
    // The "Generate" button is replaced by "Sign in to generate" button
    expect(screen.queryByRole("button", { name: /^generate$/i })).toBeNull();
  });

  it("pre-fills builder and target from initialValues", () => {
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{
          builder: "Spotify",
          target: "LinkedIn",
          extraDetails: "Make it corporate",
        }}
      />
    );
    expect((screen.getByLabelText(/builder/i) as HTMLSelectElement).value).toBe("Spotify");
    expect((screen.getByLabelText(/target/i) as HTMLSelectElement).value).toBe("LinkedIn");
    expect((screen.getByLabelText(/extra details/i) as HTMLTextAreaElement).value).toBe("Make it corporate");
  });

  it("uses default values when no initialValues provided", () => {
    render(<GeneratorForm {...defaultProps} />);
    expect((screen.getByLabelText(/builder/i) as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText(/target/i) as HTMLSelectElement).value).toBe("");
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
        initialValues={{ builder: "Apple", target: "LinkedIn" }}
      />
    );
    const button = screen.getByRole("button", { name: /generate/i });
    fireEvent.click(button);

    expect(mockGenerate).toHaveBeenCalledWith({
      builder: "Apple",
      target: "LinkedIn",
      extraDetails: "",
    }, undefined);
  });

  it("displays error message when error is present", () => {
    mockError = "Generation failed (500)";
    render(
      <GeneratorForm
        {...defaultProps}
        initialValues={{ builder: "Apple", target: "LinkedIn" }}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Generation failed (500)");
  });
});
