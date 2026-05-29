import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmailPasswordSignInForm } from "@/components/email-password-sign-in-form";

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  }),
}));

describe("EmailPasswordSignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for both email and password", async () => {
    render(<EmailPasswordSignInForm />);

    fireEvent.click(screen.getByRole("button", { name: /continue with test email/i }));

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("falls back to sign-up when sign-in fails", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });
    mockSignUp.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(<EmailPasswordSignInForm />);

    fireEvent.change(screen.getByLabelText(/test email/i), {
      target: { value: "agent@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/test password/i), {
      target: { value: "Passw0rd-test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue with test email/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "agent@example.com",
        password: "Passw0rd-test",
      });
    });
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "agent@example.com",
      password: "Passw0rd-test",
    });
    expect(await screen.findByText(/check your email/i)).toBeDefined();
  });
});
