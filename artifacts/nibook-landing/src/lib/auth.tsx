import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserSchema } from "@insforge/sdk";
import { insforge } from "./insforge";

type InsforgeUser = UserSchema;

interface AuthContextType {
  user: InsforgeUser | null;
  loading: boolean;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InsforgeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      setUser(data ?? null);
      setLoading(false);
    });
  }, []);

  async function signUp(email: string, password: string, businessName: string) {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: businessName,
    });
    if (error) return { error: error.message ?? "Sign up failed" };

    if (data?.user) {
      setUser(data.user);
      // Create a profile row keyed to this user's ID
      await insforge.database
        .from("profiles")
        .insert({ id: data.user.id, user_id: data.user.id, business_name: businessName });
    }

    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message ?? "Sign in failed" };
    if (data?.user) setUser(data.user);
    return { error: null };
  }

  async function signOut() {
    await insforge.auth.signOut();
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
