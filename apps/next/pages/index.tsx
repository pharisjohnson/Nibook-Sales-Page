import Link from "next/link";

export default function Home() {
  return (
    <main style={{padding:20,fontFamily:'system-ui,sans-serif'}}>
      <h1>Nibook — Landing (placeholder)</h1>
      <p>Quick links:</p>
      <ul>
        <li><Link href="/auth/signup">Sign Up</Link></li>
        <li><Link href="/auth/login">Sign In</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/b/sample-tenant">Public Booking (sample)</Link></li>
      </ul>
    </main>
  );
}
