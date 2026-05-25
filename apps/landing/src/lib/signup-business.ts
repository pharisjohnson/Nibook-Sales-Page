const PENDING_BUSINESS_NAME_KEY = "nibook_pending_business_name";

export function setPendingBusinessName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(PENDING_BUSINESS_NAME_KEY, trimmed);
  } catch {
    /* private mode / blocked storage */
  }
}

export function getPendingBusinessName(): string {
  try {
    return sessionStorage.getItem(PENDING_BUSINESS_NAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function clearPendingBusinessName() {
  try {
    sessionStorage.removeItem(PENDING_BUSINESS_NAME_KEY);
  } catch {
    /* ignore */
  }
}

/** Business name from auth user fields (signup sends `name` in metadata). */
export function getSignupBusinessName(user: unknown): string {
  if (!user || typeof user !== "object") return getPendingBusinessName();
  const u = user as Record<string, unknown>;
  const meta = (u.user_metadata ?? u.raw_user_meta_data) as Record<string, unknown> | undefined;
  const fromUser =
    (typeof u.name === "string" ? u.name : "") ||
    (typeof meta?.business_name === "string" ? meta.business_name : "") ||
    (typeof meta?.name === "string" ? meta.name : "");
  return (fromUser.trim() || getPendingBusinessName()).trim();
}

export function slugFromBusinessName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
