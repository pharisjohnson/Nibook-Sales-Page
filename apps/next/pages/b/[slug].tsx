import { useRouter } from "next/router";

export default function PublicBooking() {
  const { query } = useRouter();
  const slug = query.slug as string | undefined;

  return (
    <main style={{padding:20}}>
      <h1>Public Booking — {slug ?? "(loading)"}</h1>
      <p>This page will render the public booking flow for the tenant.</p>
    </main>
  );
}
