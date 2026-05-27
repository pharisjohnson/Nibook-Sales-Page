import { Redirect, useParams } from "wouter";
import { isReservedSlug, publicBookingPath } from "@/lib/routes";
import NotFound from "@/pages/not-found";

/** Legacy /:slug URLs → canonical /b/:slug (brief public booking route). */
export default function LegacySlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || isReservedSlug(slug)) return <NotFound />;
  return <Redirect to={publicBookingPath(slug)} />;
}
