/** Central route map — mirrors the project brief (Pages Router paths as Wouter paths). */

export const ROUTES = {
  home: "/",
  directory: "/directory",
  waitlist: "/waitlist",
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
  },
  onboarding: "/onboarding",
  dashboard: {
    home: "/dashboard",
    services: "/services",
    bookings: "/bookings",
    availability: "/availability",
    team: "/team",
    settings: "/settings",
    analytics: "/analytics",
  },
  /** Public tenant booking page (brief: pages/b/[slug].tsx) */
  publicBooking: (slug: string) => `/b/${slug}`,
  upgrade: "/upgrade",
} as const;

/** Paths that must not be treated as merchant slugs */
export const RESERVED_SLUGS = new Set([
  "dashboard",
  "services",
  "bookings",
  "availability",
  "team",
  "settings",
  "analytics",
  "onboarding",
  "directory",
  "waitlist",
  "upgrade",
  "feedback",
  "referral",
  "privacy",
  "terms",
  "help",
  "contact",
  "reviews",
  "feature-requests",
  "subscription",
  "auth",
  "b",
  "api",
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function publicBookingPath(slug: string) {
  return ROUTES.publicBooking(slug);
}
