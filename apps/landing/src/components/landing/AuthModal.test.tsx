import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthModal } from "./AuthModal";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => [null, vi.fn()],
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useAuth } from "@/lib/auth";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSendResetPasswordEmail = vi.fn();
const mockVerifyResetCode = vi.fn();
const mockResetPassword = vi.fn();

function setupMocks() {
  (useAuth as any).mockReturnValue({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    sendResetPasswordEmail: mockSendResetPasswordEmail,
    verifyResetCode: mockVerifyResetCode,
    resetPassword: mockResetPassword,
    signOut: vi.fn(),
  });
}

describe("AuthModal - Forgot Password Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it("should show forgot password link on sign-in form", () => {
    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });

  it("should navigate to forgot email step when clicking forgot password", async () => {
    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);
    await userEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("Reset password")).toBeInTheDocument();
    expect(screen.getByText("Send Reset Code")).toBeInTheDocument();
  });

  it("should send reset code email and show code input", async () => {
    mockSendResetPasswordEmail.mockResolvedValue({ error: null });

    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);
    await userEvent.click(screen.getByText("Forgot password?"));

    const emailInput = screen.getByPlaceholderText("Enter your email");
    await userEvent.type(emailInput, "user@test.com");

    await userEvent.click(screen.getByText("Send Reset Code"));

    await waitFor(() => {
      expect(mockSendResetPasswordEmail).toHaveBeenCalledWith("user@test.com");
    });
    expect(screen.getByText("Reset code")).toBeInTheDocument();
  });

  it("should show error when sendResetPasswordEmail fails", async () => {
    mockSendResetPasswordEmail.mockResolvedValue({ error: "Email not found" });

    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);
    await userEvent.click(screen.getByText("Forgot password?"));

    const emailInput = screen.getByPlaceholderText("Enter your email");
    await userEvent.type(emailInput, "missing@test.com");

    await userEvent.click(screen.getByText("Send Reset Code"));

    await waitFor(() => {
      expect(screen.getByText("Email not found")).toBeInTheDocument();
    });
  });

  it("should verify reset code and show new password input", async () => {
    mockSendResetPasswordEmail.mockResolvedValue({ error: null });
    mockVerifyResetCode.mockResolvedValue({ error: null, resetToken: "reset-token-123" });

    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);

    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByPlaceholderText("Enter your email"), "user@test.com");
    await userEvent.click(screen.getByText("Send Reset Code"));

    await waitFor(() => {
      expect(screen.getByText("Reset code")).toBeInTheDocument();
    });

    const codeInputs = screen.getAllByRole("textbox");
    const codeInput = codeInputs[0];
    await userEvent.type(codeInput, "123456");

    await userEvent.click(screen.getByText("Verify Code"));

    await waitFor(() => {
      expect(mockVerifyResetCode).toHaveBeenCalledWith("user@test.com", "123456");
    });
    expect(screen.getByText("Choose a new password for your account")).toBeInTheDocument();
  });

  it("should show error on invalid reset code", async () => {
    mockSendResetPasswordEmail.mockResolvedValue({ error: null });
    mockVerifyResetCode.mockResolvedValue({ error: "Invalid code", resetToken: null });

    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);

    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByPlaceholderText("Enter your email"), "user@test.com");
    await userEvent.click(screen.getByText("Send Reset Code"));

    await waitFor(() => {
      expect(screen.getByText("Reset code")).toBeInTheDocument();
    });

    const codeInputs = screen.getAllByRole("textbox");
    await userEvent.type(codeInputs[0], "000000");
    await userEvent.click(screen.getByText("Verify Code"));

    await waitFor(() => {
      expect(screen.getByText("Invalid code")).toBeInTheDocument();
    });
  });

  it("should reset password successfully", async () => {
    mockSendResetPasswordEmail.mockResolvedValue({ error: null });
    mockVerifyResetCode.mockResolvedValue({ error: null, resetToken: "reset-token-123" });
    mockResetPassword.mockResolvedValue({ error: null });

    const onClose = vi.fn();

    render(<AuthModal open={true} onClose={onClose} defaultTab="signin" />);

    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByPlaceholderText("Enter your email"), "user@test.com");
    await userEvent.click(screen.getByText("Send Reset Code"));

    await waitFor(() => {
      expect(screen.getByText("Reset code")).toBeInTheDocument();
    });

    const codeInputs = screen.getAllByRole("textbox");
    await userEvent.type(codeInputs[0], "123456");
    await userEvent.click(screen.getByText("Verify Code"));

    await waitFor(() => {
      expect(screen.getByText("Choose a new password for your account")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    await userEvent.type(passwordInput, "newSecurePass123");
    await userEvent.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("newSecurePass123", "reset-token-123");
    });
  });

  it("should go back to sign in from forgot step", async () => {
    render(<AuthModal open={true} onClose={vi.fn()} defaultTab="signin" />);
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.click(screen.getByText("Back to sign in"));

    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
  });
});
