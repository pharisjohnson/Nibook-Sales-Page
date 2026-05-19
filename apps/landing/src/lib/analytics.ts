import posthog from "posthog-js";

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? "https://app.posthog.com";
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function identifyUser(id: string, email: string, businessName?: string) {
  posthog.identify(id, { email, business_name: businessName });
}

export function resetAnalyticsUser() {
  posthog.reset();
}

// Auth funnel
export const track = {
  signedUp: (plan?: string) => posthog.capture("user_signed_up", { plan }),
  signedIn: () => posthog.capture("user_signed_in"),
  signedOut: () => posthog.capture("user_signed_out"),

  // Onboarding
  onboardingStarted: () => posthog.capture("onboarding_started"),
  onboardingCompleted: () => posthog.capture("onboarding_completed"),

  // Core product
  serviceCreated: () => posthog.capture("service_created"),
  bookingCreated: (source: "manual" | "client") => posthog.capture("booking_created", { source }),
  teamMemberInvited: () => posthog.capture("team_member_invited"),

  // Subscription funnel
  subscriptionPageViewed: (plan: string) => posthog.capture("subscription_page_viewed", { plan }),
  subscriptionStarted: (plan: string) => posthog.capture("subscription_started", { plan }),
  subscriptionCompleted: (plan: string) => posthog.capture("subscription_completed", { plan }),
  subscriptionCancelled: (plan: string) => posthog.capture("subscription_cancelled", { plan }),
};
