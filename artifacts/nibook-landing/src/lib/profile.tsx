import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export interface Profile {
  id: string;
  business_name: string | null;
  slug: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Omit<Profile, "id" | "created_at">>) => Promise<{ error: string | null }>;
  refresh: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data as Profile);
        setLoading(false);
      });
  }, [user, tick]);

  async function updateProfile(updates: Partial<Omit<Profile, "id" | "created_at">>) {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (!error) setTick(t => t + 1);
    return { error: error?.message ?? null };
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, refresh: () => setTick(t => t + 1) }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
