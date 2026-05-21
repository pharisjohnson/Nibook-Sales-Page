import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "./api";
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
  avatar_url: string | null;
  onboarding_completed: boolean;
  plan: string | null;
  mpesa_paybill: string | null;
  mpesa_account: string | null;
  whatsapp_enabled: boolean;
  whatsapp_phone: string | null;
  reminder_hours: number | null;
  cancellation_policy: string | null;
  booking_widget_theme: string | null;
  payout_mobile: string | null;
  payout_bank_name: string | null;
  payout_bank_account: string | null;
  payout_account_name: string | null;
  google_calendar_email: string | null;
  api_key: string | null;
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
    apiFetch<{ data: Profile }>(`/profile/${user.id}`).then(({ data }) => {
      if (data?.data) setProfile(data.data);
      setLoading(false);
    });
  }, [user, tick]);

  async function updateProfile(updates: Partial<Omit<Profile, "id" | "created_at">>) {
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await apiFetch<{ data: Profile }>(`/profile/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (!error && data?.data) setProfile(data.data);
    return { error };
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
