export function decodeJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return (payload.sub ?? payload.id ?? null) as string | null;
  } catch {
    return null;
  }
}
