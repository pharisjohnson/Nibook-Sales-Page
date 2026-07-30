import { getInsforgeAdmin } from "./insforge";

export interface AuthUser {
  id: string;
  email: string;
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Not authenticated");
  }

  const token = authHeader.slice(7);
  const client = getInsforgeAdmin();
  const { data, error } = await client.auth.getUser(token);

  if (error || !(data as any)?.user) {
    throw new AuthError("Invalid or expired token");
  }

  const user = (data as any).user;
  return { id: user.id, email: user.email ?? "" };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
