import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserSchema } from "@insforge/sdk";
import { insforge } from "./insforge";
import { setSession, clearSession, getStoredUser, apiFetch } from "./api";
import { identifyUser, resetAnalyticsUser, track } from "./analytics";

type InsforgeUser = UserSchema;

export const PENDING_SIGNUP_KEY = "nibook_pending_signup";

interface PendingSignup {
  email: string;
  password: string;
  businessName: string;
}

interface AuthContextType {
  user: InsforgeUser | null;
  loading: boolean;
  emailVerificationSent: boolean;
  emailVerificationSuccess: boolean;
  pendingEmail: string;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: string | null; needsEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  clearVerificationFlag: () => void;
  sendResetCode: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (otp: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InsforgeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      const sdkUser = data?.user ?? null;
      if (sdkUser) {
        setUser(sdkUser);
        const stored = getStoredUser();
        if (!stored || stored.id !== sdkUser.id) {
          const raw = data as any;
          const token = raw?.session?.access_token ?? raw?.access_token ?? null;
          if (token) setSession({ id: sdkUser.id, email: sdkUser.email ?? "" }, token);
        }
      } else {
        const stored = getStoredUser();
        if (!stored) clearSession();
      }
      setLoading(false);
    });
  }, []);

  async function signUp(email: string, password: string, businessName: string) {
    const { data, error } = await apiFetch<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, businessName }),
    });
    if (error) return { error };

    if (data?.requireEmailVerification) {
      setPendingEmail(email);
      setEmailVerificationSent(true);
      sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({ email, password, businessName }));
      return { error: null, needsEmailVerification: true };
    }

    if (data?.user?.id) {
      setUser(data.user);
      if (data.token) setSession({ id: data.user.id, email: data.user.email ?? "" }, data.token);
      identifyUser(data.user.id, data.user.email ?? "", businessName);
      track.signedUp();
    }

    return { error: null };
  }

  async function verifyEmail(email: string, otp: string) {
    const { error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) return { error };
    setEmailVerificationSuccess(true);

    const stored = sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (stored) {
      try {
        const { password } = JSON.parse(stored);
        return await signIn(email, password);
      } catch {}
    }
    return { error: null };
  }

  async function resendVerificationCode(email: string) {
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) return { error };
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await apiFetch("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (error) return { error };
    if (data?.user?.id) {
      setUser(data.user);
      if (data.token) setSession({ id: data.user.id, email: data.user.email ?? "" }, data.token);
      identifyUser(data.user.id, data.user.email ?? "");
      track.signedIn();
    }
    return { error: null };
  }

  async function signOut() {
    await insforge.auth.signOut();
    clearSession();
    resetAnalyticsUser();
    setUser(null);
  }

  async function sendResetCode(email: string) {
    const { error } = await insforge.auth.sendResetPasswordEmail({ email });
    if (error) return { error: (error as any)?.message ?? String(error) };
    return { error: null };
  }

  async function resetPassword(otp: string, newPassword: string) {
    const { error } = await insforge.auth.resetPassword({ otp, newPassword });
    if (error) return { error: (error as any)?.message ?? String(error) };
    return { error: null };
  }

  function clearVerificationFlag() {
    setEmailVerificationSent(false);
    setEmailVerificationSuccess(false);
    setPendingEmail("");
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      emailVerificationSent, emailVerificationSuccess, pendingEmail,
      signUp, verifyEmail, resendVerificationCode, signIn, signOut, clearVerificationFlag,
      sendResetCode, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
