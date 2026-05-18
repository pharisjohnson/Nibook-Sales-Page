import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { insforge } from "./insforge";

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

function toUser(raw: any): NibookUser | null {
  if (!raw) return null;
  return {
    id: raw.id ?? "",
    email: raw.email ?? "",
    displayName: raw.displayName ?? raw.name ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NibookUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.auth.getCurrentUser()
      .then(({ data }) => {
        setUser(toUser(data?.user ?? null));
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function signUp(email: string, password: string, businessName: string) {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: businessName,
    });
    if (error) return { error: error.message };
    const u = (data as any)?.user ?? (data as any);
    setUser(toUser(u));
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const u = (data as any)?.user ?? (data as any);
    setUser(toUser(u));
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
