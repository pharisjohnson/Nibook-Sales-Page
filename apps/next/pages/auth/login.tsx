import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      // Server sets an HttpOnly cookie for the session; rely on that and redirect
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 640, margin: "0 auto" }}>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 8 }} />
        </label>

        <label>
          Password
          <br />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%", padding: 8 }} />
        </label>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: "10px 14px" }}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>

      <p style={{ marginTop: 12 }}>
        Don't have an account? <Link href="/auth/signup">Sign up</Link>
      </p>
    </main>
  );
}
