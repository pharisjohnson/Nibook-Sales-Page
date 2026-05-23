import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserSchema } from "@insforge/sdk";
import { insforge } from "./insforge";
import { setSession, clearSession, getStoredUser } from "./api";
import { identifyUser, resetAnalyticsUser, track } from "./analytics";

type InsforgeUser = UserSchema;

interface AuthContextType {
  user: InsforgeUser | null;
  loading: boolean;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: string | null; requiresVerification: boolean }>;
  verifyEmail: (email: string, otp: string, businessName?: string) => Promise<{ error: string | null }>;
  resendVerification: (email: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InsforgeUser | null>(null);
  const [loading, setLoading] = useState(true);

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
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: businessName,
    });
    if (error) return { error: (error as any).message ?? "Sign up failed", requiresVerification: false };

    const raw = data as any;
    const token = raw?.session?.access_token ?? raw?.access_token ?? null;
    const requiresVerification = !token;

    if (data?.user && token) {
      setUser(data.user);
      setSession({ id: data.user.id, email: data.user.email ?? "" }, token);
      const name = businessName.trim();
      const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : undefined;
      try {
        await insforge.database.from("profiles").upsert(
          {
            id: data.user.id,
            ...(name ? { business_name: name, slug } : {}),
            plan: "trial",
          },
          { onConflict: "id" },
        );
      } catch (_) { /* row may already exist from a trigger */ }
      identifyUser(data.user.id, data.user.email ?? "", name);
      track.signedUp();
    }

    return { error: null, requiresVerification };
  }

  async function verifyEmail(email: string, otp: string, businessName?: string) {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) return { error: (error as any).message ?? "Verification failed" };
    if (data?.user) {
      setUser(data.user);
      const raw = data as any;
      const sessionToken = data.accessToken ?? raw?.session?.access_token ?? raw?.access_token ?? null;
      if (sessionToken) {
        setSession({ id: data.user.id, email: data.user.email ?? "" }, sessionToken);
        insforge.setAccessToken(sessionToken);
      }
      try {
        await insforge.database.from("profiles").upsert(
          {
            id: data.user.id,
            ...(businessName ? { business_name: businessName } : {}),
          },
          { onConflict: "id" },
        );
      } catch (_) { /* row already exists */ }
      track.signedUp();
    }
    return { error: null };
  }

  async function resendVerification(email: string) {
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) return { error: (error as any).message ?? "Failed to resend code" };
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) return { error: (error as any).message ?? "Sign in failed" };
    if (data?.user) {
      setUser(data.user);
      const raw = data as any;
      const token = raw?.session?.access_token ?? raw?.access_token ?? null;
      if (token) setSession({ id: data.user.id, email: data.user.email ?? "" }, token);
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

  return (
    <AuthContext.Provider value={{ user, loading, signUp, verifyEmail, resendVerification, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
