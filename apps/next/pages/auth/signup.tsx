import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signup failed");
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
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Email
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 8 }} />
        </label>

        <label>
          Password
          <br />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} style={{ width: "100%", padding: 8 }} />
        </label>

        <label>
          Business name
          <br />
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} type="text" style={{ width: "100%", padding: 8 }} />
        </label>

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: "10px 14px" }}>{loading ? "Creating…" : "Create account"}</button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link href="/auth/login">Sign in</Link>
      </p>
    </main>
  );
}
