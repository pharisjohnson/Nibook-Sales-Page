import crypto from "node:crypto";

// ─── Required env vars ────────────────────────────────────────────────────────
// JENGA_API_KEY       — Bearer token from your JengaHQ dashboard
// JENGA_MERCHANT_CODE — Merchant code assigned at registration
// JENGA_PRIVATE_KEY   — RSA 2048-bit private key in PEM format
//                       Store newlines as \n in Vercel env vars
// JENGA_BASE_URL      — https://api.jenga.com (confirm sandbox vs prod from dashboard)
// JENGA_ACCOUNT_NUMBER— Your Equity Bank account number (source for disbursements)
// ─────────────────────────────────────────────────────────────────────────────

export const JENGA_BASE = process.env.JENGA_BASE_URL ?? "https://api.jenga.com";
export const MERCHANT_CODE = process.env.JENGA_MERCHANT_CODE ?? "";
export const NIBOOK_ACCOUNT = process.env.JENGA_ACCOUNT_NUMBER ?? "";

// Nibook facilitation fee — 3% of each booking payment
export const PLATFORM_FEE_PCT = Number(process.env.NIBOOK_FEE_PCT ?? "3") / 100;

function getPrivateKey(): string {
  return (process.env.JENGA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
}

export function signData(data: string): string {
  const signer = crypto.createSign("SHA256");
  signer.update(data);
  return signer.sign({ key: getPrivateKey(), format: "pem" }, "base64");
}

function baseHeaders(signature: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.JENGA_API_KEY ?? ""}`,
    "signature": signature,
  };
}

export async function jengaPost<T = unknown>(
  path: string,
  body: object,
  signatureFields: string,
): Promise<{ ok: boolean; status: number; data: T }> {
  const signature = signData(signatureFields);
  const res = await fetch(`${JENGA_BASE}${path}`, {
    method: "POST",
    headers: baseHeaders(signature),
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function jengaGet<T = unknown>(
  path: string,
  signatureFields: string,
): Promise<{ ok: boolean; status: number; data: T }> {
  const signature = signData(signatureFields);
  const res = await fetch(`${JENGA_BASE}${path}`, {
    method: "GET",
    headers: baseHeaders(signature),
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

export function makeReference(): string {
  return `NBK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Calculate what business receives after Nibook fee
export function splitAmount(totalKes: number): { businessAmount: number; nibookFee: number } {
  const nibookFee = Math.round(totalKes * PLATFORM_FEE_PCT);
  return { businessAmount: totalKes - nibookFee, nibookFee };
}
