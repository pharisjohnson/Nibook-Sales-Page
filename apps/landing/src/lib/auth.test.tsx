import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth";

vi.mock("./insforge", () => {
  const mockAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    verifyEmail: vi.fn(),
    resendVerificationEmail: vi.fn(),
    sendResetPasswordEmail: vi.fn(),
    exchangeResetPasswordToken: vi.fn(),
    resetPassword: vi.fn(),
  };
  const mockDatabase = {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    insforge: {
      auth: mockAuth,
      database: mockDatabase,
      setAccessToken: vi.fn(),
    },
  };
});

vi.mock("./api", () => ({
  setSession: vi.fn(),
  clearSession: vi.fn(),
  getStoredUser: vi.fn().mockReturnValue(null),
}));

vi.mock("./analytics", () => ({
  identifyUser: vi.fn(),
  resetAnalyticsUser: vi.fn(),
  track: { signedUp: vi.fn(), signedIn: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send reset password email", async () => {
    const { insforge } = await import("./insforge");
    (insforge.auth.sendResetPasswordEmail as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.sendResetPasswordEmail("user@test.com");
    });

    expect(insforge.auth.sendResetPasswordEmail).toHaveBeenCalledWith({ email: "user@test.com" });
    expect(res.error).toBeNull();
  });

  it("should return error if sendResetPasswordEmail fails", async () => {
    const { insforge } = await import("./insforge");
    (insforge.auth.sendResetPasswordEmail as any).mockResolvedValue({ error: { message: "User not found" } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.sendResetPasswordEmail("missing@test.com");
    });

    expect(res.error).toBe("User not found");
  });

  it("should verify reset code and return token", async () => {
    const { insforge } = await import("./insforge");
    (insforge.auth.exchangeResetPasswordToken as any).mockResolvedValue({ data: { token: "reset-token-123" }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.verifyResetCode("user@test.com", "123456");
    });

    expect(insforge.auth.exchangeResetPasswordToken).toHaveBeenCalledWith({ email: "user@test.com", code: "123456" });
    expect(res.error).toBeNull();
    expect(res.resetToken).toBe("reset-token-123");
  });

  it("should return error on invalid reset code", async () => {
    const { insforge } = await import("./insforge");
    (insforge.auth.exchangeResetPasswordToken as any).mockResolvedValue({ data: null, error: { message: "Invalid code" } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.verifyResetCode("user@test.com", "000000");
    });

    expect(res.error).toBe("Invalid code");
    expect(res.resetToken).toBeNull();
  });

  it("should reset password with token", async () => {
    const { insforge } = await import("./insforge");
    (insforge.auth.resetPassword as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.resetPassword("newPass123", "reset-token-123");
    });

    expect(insforge.auth.resetPassword).toHaveBeenCalledWith({ newPassword: "newPass123", otp: "reset-token-123" });
    expect(res.error).toBeNull();
  });

  it("should return error if resetPassword fails", async () => {
    const { insforge } = await import("./insforge");
    (insforge.auth.resetPassword as any).mockResolvedValue({ error: { message: "Token expired" } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let res: any;
    await act(async () => {
      res = await result.current.resetPassword("newPass123", "expired-token");
    });

    expect(res.error).toBe("Token expired");
  });
});
