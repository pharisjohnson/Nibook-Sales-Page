import { createContext, useContext, useState, type ReactNode } from "react";
import { apiFetch, setSession, getStoredUser, clearSession } from "./api";

export interface NibookUser {
  id: string;
  email: string;
  displayName?: string | null;
}

interface AuthContextType {
  user: NibookUser | null;
  loading: boolean;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NibookUser | null>(() => getStoredUser());
  const loading = false;

  async function signUp(email: string, password: string, businessName: string) {
    const { data, error } = await apiFetch<{ user: NibookUser; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, businessName }),
    });
    if (error || !data) return { error: error ?? "Sign up failed" };
    setSession(data.user, data.token ?? "");
    setUser(data.user);
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await apiFetch<{ user: NibookUser; token: string }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (error || !data) return { error: error ?? "Sign in failed" };
    setSession(data.user, data.token ?? "");
    setUser(data.user);
    return { error: null };
  }

  async function signOut() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
