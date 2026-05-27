/** East Africa phone helpers (Kenya +254, Uganda +256, Tanzania +255). */

export type PhoneRegion = "KE" | "UG" | "TZ" | null;

const REGION_PREFIX: Record<Exclude<PhoneRegion, null>, string> = {
  KE: "254",
  UG: "256",
  TZ: "255",
};

export function detectPhoneRegion(digits: string): PhoneRegion {
  if (digits.startsWith("254")) return "KE";
  if (digits.startsWith("256")) return "UG";
  if (digits.startsWith("255")) return "TZ";
  if (digits.startsWith("0")) return "KE";
  if (digits.startsWith("7") && digits.length === 9) return "KE";
  return null;
}

export function normalizeEastAfricaPhone(raw: string): {
  valid: boolean;
  e164: string | null;
  display: string | null;
  region: PhoneRegion;
  error: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: true, e164: null, display: null, region: null, error: null };
  }

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  const region = detectPhoneRegion(digits);
  if (!region) {
    return {
      valid: false,
      e164: null,
      display: null,
      region: null,
      error: "Use a Kenya (+254), Uganda (+256), or Tanzania (+255) number.",
    };
  }

  const prefix = REGION_PREFIX[region];
  if (digits.startsWith("0")) digits = prefix + digits.slice(1);
  else if (!digits.startsWith(prefix)) {
    if (region === "KE" && digits.length === 9) digits = prefix + digits;
    else if ((region === "UG" || region === "TZ") && digits.length >= 9) digits = prefix + digits;
    else digits = prefix + digits;
  }

  const nationalLen = region === "KE" ? 9 : 9;
  const national = digits.slice(prefix.length);
  if (national.length !== nationalLen) {
    return {
      valid: false,
      e164: null,
      display: null,
      region,
      error: `Enter a valid ${nationalLen}-digit number after +${prefix}.`,
    };
  }

  const e164 = `+${digits}`;
  const display = `+${prefix} ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`.trim();
  return { valid: true, e164, display, region, error: null };
}
