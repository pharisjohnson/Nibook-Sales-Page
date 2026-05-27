import Link from "next/link";

export default function Dashboard() {
  return (
    <main style={{padding:20}}>
      <h1>Dashboard (placeholder)</h1>
      <p>Overview, upcoming bookings, revenue metrics.</p>
      <ul>
        <li><Link href="/dashboard/services">Services</Link></li>
        <li><Link href="/dashboard/availability">Availability</Link></li>
      </ul>
    </main>
  );
}
