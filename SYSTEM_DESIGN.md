# Nibook — Next.js + InsForge Rebuild System Design

## 1. Overview

### What We're Building

**Nibook** is a booking and business management SaaS platform for service professionals in East Africa (Kenya, Uganda, Tanzania). Businesses create a public booking page, manage services/availability, track bookings, accept M-Pesa payments, and sync with Google Calendar.

### Tech Stack

| Layer | Current | Target |
|---|---|---|
| Framework | React 19 + Vite SPA | Next.js 15 (App Router) |
| Database/BaaS | Express API + InsForge SDK | InsForge SDK directly (PostgREST) |
| Auth | InsForge Auth SDK (localStorage token) | NextAuth.js v5 + InsForge Auth |
| State | React Context + TanStack Query | Tanstack Query (server state) + Zustand (client state) |
| Styling | Tailwind CSS 4.1 | Tailwind CSS 3.4 (per AGENTS.md) |
| UI Components | Radix UI + custom shadcn/ui | shadcn/ui v1 |
| Payments | Paystack (subscription) + PayHero (M-Pesa) | Same (server-side) |
| Calendar | Google Calendar OAuth | Same (server-side) |
| Deployment | Vercel (frontend) + Docker (API) | Vercel (frontend + server actions) |

### Why Next.js

- **Server Components** — Landing page sections render server-side, reducing JS bundle
- **Server Actions** — Replace the entire Express API server; type-safe, runs on the same deployment
- **Route Groups** — Clean separation of `(marketing)`, `(dashboard)`, `(auth)`, `(booking)`
- **Middleware** — Auth + onboarding guards at the edge, no custom `ProtectedDashboard` wrapper
- **Dynamic Routes** — `/b/[slug]`, `/directory`, `/settings` all handled by Next.js file routing
- **Image Optimization** — `next/image` for profile/service photos from InsForge Storage
- **ISR** — Public booking pages (`/b/[slug]`) can revalidate on-demand

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Vercel                           │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │              Next.js App                       │  │
│  │                                               │  │
│  │  (marketing)     Route Groups                 │  │
│  │  (auth)                                        │  │
│  │  (dashboard)                                   │  │
│  │  (booking-store)                               │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │     Server Actions (app/actions/)       │ │  │
│  │  │  • bookings.ts                          │ │  │
│  │  │  • services.ts                          │ │  │
│  │  │  • profile.ts                           │ │  │
│  │  │  • subscriptions.ts                     │ │  │
│  │  │  • payments.ts                          │ │  │
│  │  │  • availability.ts                      │ │  │
│  │  │  • team.ts                             │ │  │
│  │  │  • auth.ts                             │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │     Middleware (auth + onboarding)      │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                         │                            │
│                         ▼                            │
│  ┌──────────────────────────────────────────────┐  │
│  │            InsForge Platform                 │  │
│  │  ┌─────────────┐  ┌──────────────────────┐   │  │
│  │  │  PostgreSQL  │  │    PostgREST API    │   │  │
│  │  │  (Database)  │  │   (auto-generated)  │   │  │
│  │  └─────────────┘  └──────────────────────┘   │  │
│  │  ┌─────────────┐  ┌──────────────────────┐   │  │
│  │  │ Auth System  │  │    Storage Bucket    │   │  │
│  │  │ (email/OAuth)│  │   (nibook-media)     │   │  │
│  │  └─────────────┘  └──────────────────────┘   │  │
│  │  ┌─────────────┐                             │  │
│  │  │ Realtime    │                             │  │
│  │  │ (WebSocket) │                             │  │
│  │  └─────────────┘                             │  │
│  └──────────────────────────────────────────────┘  │
│                         │                            │
│                         ▼                            │
│              External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Paystack    │  │  PayHero    │  │    Google   │  │
│  │  (billing)   │  │  (M-Pesa)   │  │  Calendar   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
nibook/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Route group: public landing pages
│   │   │   ├── page.tsx              # /
│   │   │   ├── directory/
│   │   │   ├── waitlist/
│   │   │   ├── feedback/
│   │   │   ├── referral/
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   ├── help/
│   │   │   ├── contact/
│   │   │   ├── reviews/
│   │   │   ├── feature-requests/
│   │   │   └── upgrade/
│   │   │
│   │   ├── (auth)/                   # Route group: authentication
│   │   │   ├── login/
│   │   │   └── signup/
│   │   │
│   │   ├── (dashboard)/              # Route group: protected dashboard
│   │   │   ├── layout.tsx            # Dashboard shell (sidebar + header)
│   │   │   ├── dashboard/
│   │   │   ├── services/
│   │   │   ├── bookings/
│   │   │   ├── availability/
│   │   │   ├── team/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   │
│   │   ├── (booking-store)/          # Route group: public booking pages
│   │   │   └── b/
│   │   │       └── [slug]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── onboarding/
│   │   │
│   │   ├── api/                      # API Routes (webhooks only)
│   │   │   ├── webhooks/
│   │   │   │   ├── paystack/
│   │   │   │   └── payhero/
│   │   │   └── google/
│   │   │       └── callback/
│   │   │
│   │   ├── subscription/
│   │   │   └── callback/
│   │   │
│   │   ├── layout.tsx               # Root layout (providers)
│   │   └── globals.css
│   │
│   ├── actions/                      # Server Actions (replaces Express API)
│   │   ├── auth.actions.ts          # signUp, signIn, signOut, verifyEmail, resetPassword
│   │   ├── profile.actions.ts       # getProfile, updateProfile
│   │   ├── services.actions.ts      # CRUD services
│   │   ├── bookings.actions.ts       # CRUD bookings + slot computation
│   │   ├── availability.actions.ts  # schedules, blackouts, rules
│   │   ├── team.actions.ts          # invite, accept, remove members
│   │   ├── subscription.actions.ts  # Paystack initialize, verify
│   │   ├── payment.actions.ts       # PayHero initiate, status
│   │   ├── upload.actions.ts        # InsForge Storage uploads
│   │   ├── analytics.actions.ts     # Revenue, bookings, top services
│   │   ├── directory.actions.ts     # Public directory search
│   │   └── google.actions.ts        # OAuth URL, callback, disconnect
│   │
│   ├── components/                   # Shared components
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── landing/                 # Marketing section components
│   │   │   ├── navbar.tsx
│   │   │   ├── hero.tsx
│   │   │   ├── pain-points.tsx
│   │   │   ├── features.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── pricing.tsx
│   │   │   ├── testimonials.tsx
│   │   │   ├── final-cta.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── booking-table.tsx
│   │   │   ├── analytics-charts.tsx
│   │   │   └── ...
│   │   ├── booking/                 # Booking flow components
│   │   │   ├── service-picker.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── time-slots.tsx
│   │   │   ├── client-form.tsx
│   │   │   └── confirmation.tsx
│   │   └── auth/                    # Auth components
│   │       ├── auth-modal.tsx
│   │       ├── otp-input.tsx
│   │       └── forgot-password.tsx
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── insforge.ts              # InsForge client (server-side)
│   │   ├── insforge-client.ts       # InsForge client (client-side, anon key)
│   │   ├── db.ts                    # Database helpers (server)
│   │   ├── auth.ts                  # NextAuth.js config
│   │   ├── slot-computation.ts     # Availability slot algorithm
│   │   ├── phone-normalize.ts       # East Africa phone validation
│   │   ├── slug.ts                  # Slug generation from business name
│   │   └── utils.ts                 # cn(), formatCurrency, etc.
│   │
│   ├── hooks/                       # Client hooks
│   │   ├── use-bookings.ts
│   │   ├── use-services.ts
│   │   ├── use-profile.ts
│   │   ├── use-availability.ts
│   │   └── use-analytics.ts
│   │
│   └── types/                       # Shared TypeScript types
│       ├── profile.ts
│       ├── service.ts
│       ├── booking.ts
│       ├── availability.ts
│       └── analytics.ts
│
├── middleware.ts                    # Auth + onboarding guards (edge)
├── drizzle.config.ts               # Drizzle ORM config (optional, for migrations)
└── package.json
```

---

## 4. Database Schema (InsForge PostgreSQL)

The existing schema maps 1:1 to InsForge PostgreSQL tables. No schema changes needed.

### Core Tables

```sql
-- Business/merchant profiles (extends auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  business_name TEXT,
  slug TEXT UNIQUE,
  phone TEXT,
  location TEXT,
  bio TEXT,
  category TEXT,
  logo_url TEXT,
  cover_url TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'trial',           -- trial | starter | premium
  mpesa_paybill TEXT,
  mpesa_account TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  reminder_hours INT DEFAULT 24,
  cancellation_policy TEXT,
  booking_widget_theme TEXT DEFAULT 'classic',
  payout_mobile TEXT,
  payout_bank_name TEXT,
  payout_bank_account TEXT,
  payout_account_name TEXT,
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expiry TIMESTAMPTZ,
  google_calendar_email TEXT,
  api_key TEXT,
  webhook_url TEXT,
  show_cancellation_policy BOOLEAN DEFAULT false,
  support_channel TEXT,
  support_email TEXT,
  subscription_status TEXT,            -- active | attention | non-renewing | cancelled
  subscription_plan TEXT,
  paystack_customer_code TEXT,
  subscription_code TEXT,
  subscription_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Service offerings
services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  price NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  category TEXT,
  image_url TEXT,                    -- legacy, kept for backward compat
  image_urls JSONB DEFAULT '[]',     -- array of up to 2 image URLs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Service intake questions (linked to services)
service_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text',  -- 'text' | 'number' | 'yes_no' | 'multiple_choice'
  options JSONB,                      -- for multiple_choice: array of choices
  required BOOLEAN DEFAULT false,
  order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Appointment bookings
bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  status TEXT DEFAULT 'pending',       -- pending | confirmed | completed | cancelled | no-show
  notes TEXT,
  amount NUMERIC(10,2),
  payment_status TEXT DEFAULT 'unpaid', -- unpaid | pending | paid | refunded
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Payment records
payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  booking_id UUID REFERENCES bookings(id),
  reference TEXT UNIQUE NOT NULL,
  phone TEXT,
  amount NUMERIC(10,2),
  plan TEXT,
  provider TEXT,                        -- paystack | payhero
  status TEXT DEFAULT 'pending',        -- pending | success | failed | cancelled
  provider_response JSONB,
  callback_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Weekly working hours
availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,              -- monday | tuesday | ...
  is_active BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  sort_order INT DEFAULT 0,
  UNIQUE(owner_id, day_name)
)

-- Date exceptions (holidays, closures)
availability_blackouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT
)

-- Booking rules (buffer, min notice, etc.)
availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  buffer_minutes INT DEFAULT 0,
  min_notice_hours INT DEFAULT 2,
  max_advance_days INT DEFAULT 30,
  cancellation_window_hours INT DEFAULT 24
)

-- Team members
team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'staff',           -- owner | admin | staff
  avatar_url TEXT,
  status TEXT DEFAULT 'active',         -- active | inactive
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Pending team invites
team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  token TEXT UNIQUE NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Subscription records
subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  provider_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Waitlist
waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Row Level Security (RLS)

InsForge's PostgreSQL supports RLS via PostgREST. The existing Express API uses `edgeFunctionToken` to run queries as the authenticated user. In Next.js, we use **Server Actions with `insforge.serviceRole()`** (bypasses RLS) since auth is handled separately, or **`insforge.asUser(token)`** when we need per-user RLS.

```sql
-- Example RLS policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Owners see their own bookings
CREATE POLICY "owners_see_own_bookings" ON bookings
  FOR SELECT USING (auth.uid() = owner_id);

-- Service role bypass (server actions)
CREATE POLICY "service_role_all" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Public booking store sees anonymized data
CREATE POLICY "public_see_anonymized" ON bookings
  FOR SELECT USING (
    auth.role() = 'anon'
    AND status IN ('confirmed', 'completed')
    AND scheduled_at > now()
  );
```

---

## 5. Authentication Strategy

### NextAuth.js v5 + InsForge Auth

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import { InsforgeProvider } from "next-auth/providers/insforge";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    InsforgeProvider({
      baseUrl: process.env.INSFORGE_URL!,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
```

### Middleware Guards (Edge)

```typescript
// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isDashboardRoute = pathname.startsWith("/dashboard") ||
                           pathname.startsWith("/services") ||
                           pathname.startsWith("/bookings") ||
                           pathname.startsWith("/availability") ||
                           pathname.startsWith("/team") ||
                           pathname.startsWith("/analytics") ||
                           pathname.startsWith("/settings");

  // Redirect to login if accessing protected routes while logged out
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/services", "/bookings", "/availability", "/team", "/analytics", "/settings"],
};
```

### Onboarding Gate

Check `onboarding_completed` and trial expiry in the dashboard layout server component:

```typescript
// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/insforge";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { data: profile } = await db
    .from("profiles")
    .select("onboarding_completed, plan, created_at")
    .eq("id", session.user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const TRIAL_DAYS = 7;
  const isPaid = profile.plan === "starter" || profile.plan === "premium";
  const isTrialExpired = Date.now() > new Date(profile.created_at).getTime() + TRIAL_DAYS * 86400000;
  if (!isPaid && isTrialExpired) redirect("/upgrade");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## 6. Server Actions (replaces Express API)

Every route handler in `apps/api/src/routes/` becomes a Server Action. No HTTP layer needed.

### Example: Bookings

```typescript
// src/actions/bookings.actions.ts
"use server";

import { auth } from "@/lib/auth";
import { createClient } from "@/lib/insforge";
import { revalidatePath } from "next/cache";

const db = createClient({ serverSide: true });

export async function getBookings(filters: {
  ownerId: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  let q = db
    .from("bookings")
    .select("*, services(name, price)")
    .eq("owner_id", filters.ownerId)
    .order("scheduled_at", { ascending: false })
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 100) - 1);

  if (filters.status) q = q.eq("status", filters.status);
  if (filters.from) q = q.gte("scheduled_at", filters.from);
  if (filters.to) q = q.lt("scheduled_at", filters.to);

  const { data, error } = await q;
  return { data, error };
}

export async function createBooking(input: {
  ownerId: string;
  serviceId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
  amount?: number;
}) {
  const { data, error } = await db.from("bookings").insert({
    owner_id: input.ownerId,
    service_id: input.serviceId ?? null,
    client_name: input.clientName,
    client_phone: input.clientPhone ?? null,
    client_email: input.clientEmail ?? null,
    scheduled_at: input.scheduledAt,
    duration_minutes: input.durationMinutes ?? 60,
    notes: input.notes ?? null,
    amount: input.amount ?? null,
    payment_status: "unpaid",
    status: "pending",
  }).select().single();

  if (error) return { error: error.message };

  // Non-blocking Google Calendar sync
  syncBookingToCalendar(data).catch(console.error);

  return { data, error: null };
}

export async function updateBooking(
  id: string,
  updates: Partial<{
    status: string;
    paymentStatus: string;
    notes: string;
    scheduledAt: string;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { data, error } = await db
    .from("bookings")
    .update({
      status: updates.status,
      payment_status: updates.paymentStatus,
      notes: updates.notes,
      scheduled_at: updates.scheduledAt,
    })
    .eq("id", id)
    .eq("owner_id", session.user.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return { data, error: null };
}

export async function deleteBooking(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { error } = await db
    .from("bookings")
    .delete()
    .eq("id", id)
    .eq("owner_id", session.user.id);

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { error: null };
}
```

### Example: Subscriptions (Paystack)

```typescript
// src/actions/subscription.actions.ts
"use server";

import { auth } from "@/lib/auth";
import { createClient } from "@/lib/insforge";
import { redirect } from "next/navigation";

const db = createClient({ serverSide: true });

const PAYSTACK_BASE = "https://api.paystack.co";

export async function initializeSubscription(email: string, planCode: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const reference = `NIBOOK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscription/callback`;

  const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email,
      plan: planCode,
      reference,
      callback_url: callbackUrl,
      metadata: { owner_id: session.user.id },
    }),
  });

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status) return { error: data.message };

  // Record pending payment
  await db.from("payments").insert({
    reference,
    amount: 0,
    plan: planCode,
    owner_id: session.user.id,
    status: "pending",
    provider: "paystack",
  });

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  };
}

export async function verifySubscription(reference: string) {
  const paystackRes = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status || !data.data) {
    return { paid: false, error: data.message };
  }

  const tx = data.data;
  if (tx.status !== "success") return { paid: false };

  // Update payment record
  await db
    .from("payments")
    .update({
      status: "success",
      amount: tx.amount / 100,
      updated_at: new Date().toISOString(),
    })
    .eq("reference", reference);

  // Update profile subscription
  const ownerId = tx.metadata?.owner_id;
  if (ownerId) {
    const planName = (tx.plan_object?.name ?? "").toLowerCase();
    const resolvedPlan = planName.includes("premium") ? "premium" : "starter";

    await db.from("profiles").update({
      plan: resolvedPlan,
      subscription_plan: tx.plan_object?.name ?? "paid",
      subscription_status: "active",
      paystack_customer_code: tx.customer.customer_code,
      subscription_code: tx.subscription_code ?? null,
      subscription_started_at: tx.paid_at ?? new Date().toISOString(),
    }).eq("id", ownerId);
  }

  return {
    paid: true,
    plan: tx.plan_object?.name ?? null,
    amount: tx.amount / 100,
  };
}
```

### Example: Payments (PayHero M-Pesa)

```typescript
// src/actions/payment.actions.ts
"use server";

import { createClient } from "@/lib/insforge";

const db = createClient({ serverSide: true });
const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

function payheroHeaders() {
  const t = process.env.PAYHERO_AUTH_TOKEN ?? "";
  const p = process.env.PAYHERO_PASSWORD ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${t}:${p}`).toString("base64")}`,
  };
}

export async function initiateMpesaPayment(input: {
  phone: string;
  amount: number;
  plan: string;
  ownerId?: string;
  reference?: string;
}) {
  const externalRef = input.reference ?? `NIBOOK-${input.plan.toUpperCase()}-${Date.now()}`;
  const phoneNormalized = normalizePhone(input.phone);
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payhero`;

  await db.from("payments").insert({
    reference: externalRef,
    phone: phoneNormalized,
    amount: input.amount,
    plan: input.plan,
    owner_id: input.ownerId ?? null,
    status: "pending",
    provider: "payhero",
  });

  const payheroRes = await fetch(`${PAYHERO_BASE}/payments`, {
    method: "POST",
    headers: payheroHeaders(),
    body: JSON.stringify({
      amount: input.amount,
      phone_number: phoneNormalized,
      channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
      external_reference: externalRef,
      provider: "m-pesa",
      callback_url: callbackUrl,
    }),
  });

  const data = await payheroRes.json();
  if (!payheroRes.ok) {
    await db.from("payments").update({ status: "failed" }).eq("reference", externalRef);
    return { success: false, message: data.message ?? "PayHero request failed" };
  }

  return { success: true, reference: externalRef, message: "STK Push sent" };
}
```

---

## 7. Real-Time Slot Availability Algorithm

This runs server-side in the booking store page:

```typescript
// src/lib/slot-computation.ts
import { createClient } from "@/lib/insforge";

const db = createClient({ serverSide: true });

export async function computeAvailableSlots(params: {
  ownerId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
}): Promise<{ time: string; available: boolean }[]> {
  const { ownerId, serviceId, date } = params;

  // 1. Get service duration
  const { data: service } = await db
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (!service) return [];

  const duration = service.duration_minutes ?? 60;

  // 2. Get booking rules
  const { data: rules } = await db
    .from("availability_rules")
    .select("*")
    .eq("owner_id", ownerId)
    .single();

  const minNoticeHours = rules?.min_notice_hours ?? 2;
  const bufferMinutes = rules?.buffer_minutes ?? 0;
  const maxAdvanceDays = rules?.max_advance_days ?? 30;

  // 3. Check if date is a blackout
  const { data: blackouts } = await db
    .from("availability_blackouts")
    .select("date, reason")
    .eq("owner_id", ownerId)
    .eq("date", date);

  if (blackouts?.length) return [];

  // 4. Get day of week
  const dayName = new Date(date + "T12:00:00Z")
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // 5. Get weekly schedule
  const { data: schedule } = await db
    .from("availability_schedules")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("day_name", dayName)
    .eq("is_active", true)
    .single();

  if (!schedule?.start_time || !schedule?.end_time) return [];

  // 6. Get existing bookings for the date
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;
  const { data: existingBookings } = await db
    .from("bookings")
    .select("scheduled_at, duration_minutes")
    .eq("owner_id", ownerId)
    .eq("status", "confirmed")
    .gte("scheduled_at", dayStart)
    .lt("scheduled_at", dayEnd);

  // 7. Compute slots
  const slots: { time: string; available: boolean }[] = [];
  const [startHour, startMin] = schedule.start_time.split(":").map(Number);
  const [endHour, endMin] = schedule.end_time.split(":").map(Number);

  let current = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  const now = new Date();
  const minBookingTime = new Date(now.getTime() + minNoticeHours * 3600000);

  while (current + duration <= end) {
    const slotTime = new Date(`${date}T${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}:00`);

    const isInPast = slotTime < minBookingTime;
    const isBlocked = existingBookings?.some((b) => {
      const bStart = new Date(b.scheduled_at);
      const bEnd = new Date(bStart.getTime() + (b.duration_minutes ?? 60) * 60000);
      const slotEnd = new Date(slotTime.getTime() + duration * 60000);
      return slotTime < bEnd && slotEnd > bStart;
    });

    slots.push({
      time: slotTime.toISOString(),
      available: !isInPast && !isBlocked,
    });

    current += duration + bufferMinutes;
  }

  return slots;
}
```

---

## 8. File Upload Flow

```typescript
// src/actions/upload.actions.ts
"use server";

import { auth } from "@/lib/auth";
import { createClient } from "@/lib/insforge";
import { revalidatePath } from "next/cache";

const db = createClient({ serverSide: true });

export async function uploadProfileImage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const file = formData.get("file") as File;
  if (!file || file.size > 10 * 1024 * 1024) return { error: "File too large (max 10MB)" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) return { error: "Invalid file type" };

  const ext = file.name.split(".").pop();
  const path = `profiles/${session.user.id}/${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await db.storage
    .from("nibook-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = db.storage.from("nibook-media").getPublicUrl(uploadData.path);

  await db
    .from("profiles")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", session.user.id);

  revalidatePath("/settings");
  return { url: urlData.publicUrl, error: null };
}

export async function uploadServiceImage(serviceId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const file = formData.get("file") as File;
  if (!file || file.size > 10 * 1024 * 1024) return { error: "File too large" };

  const ext = file.name.split(".").pop();
  const path = `services/${serviceId}/${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await db.storage
    .from("nibook-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = db.storage.from("nibook-media").getPublicUrl(uploadData.path);

  await db
    .from("services")
    .update({ image_url: urlData.publicUrl })
    .eq("id", serviceId)
    .eq("owner_id", session.user.id);

  revalidatePath("/services");
  return { url: urlData.publicUrl, error: null };
}
```

---

## 9. Route Structure & Page Mapping

| Current Route | Next.js Route | Notes |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Server Component |
| `/directory` | `app/(marketing)/directory/page.tsx` | Server Component + ISR |
| `/b/:slug` | `app/(booking-store)/b/[slug]/page.tsx` | ISR, revalidate on booking |
| `/auth/login` | `app/(auth)/login/page.tsx` | NextAuth signIn page |
| `/auth/signup` | `app/(auth)/signup/page.tsx` | NextAuth signUp page |
| `/onboarding` | `app/onboarding/page.tsx` | Protected + not onboarded |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Protected + onboarded |
| `/services` | `app/(dashboard)/services/page.tsx` | Protected |
| `/bookings` | `app/(dashboard)/bookings/page.tsx` | Protected |
| `/availability` | `app/(dashboard)/availability/page.tsx` | Protected |
| `/team` | `app/(dashboard)/team/page.tsx` | Protected |
| `/analytics` | `app/(dashboard)/analytics/page.tsx` | Protected |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Protected |
| `/upgrade` | `app/(marketing)/upgrade/page.tsx` | Public |
| `/subscription/callback` | `app/subscription/callback/page.tsx` | Server action verify |
| `/api/*` webhooks | `app/api/webhooks/*/route.ts` | Webhook handlers only |
| `/api/integrations/google/callback` | `app/api/google/callback/route.ts` | OAuth callback |

### API Routes (Webhooks Only)

Everything that was `apps/api/src/routes/` becomes a Server Action. Only webhooks that must receive external HTTP POSTs remain as API routes:

```
app/api/
├── webhooks/
│   ├── paystack/route.ts      # POST - Paystack subscription events
│   └── payhero/route.ts       # POST - PayHero M-Pesa callbacks
└── google/
    └── callback/route.ts      # GET - Google OAuth redirect
```

All business logic (CRUD for bookings, services, profile, etc.) moves to Server Actions.

---

## 10. Component Migration Map

### Landing Page Components (most become Server Components)

| Current | Next.js | Type |
|---|---|---|
| `Navbar.tsx` | `app/(marketing)/components/navbar.tsx` | Server Component (links are static) |
| `Hero.tsx` | `app/(marketing)/page.tsx` (inline or component) | Client (animations) |
| `PainPoints.tsx` | Static content in page | Server Component |
| `Features.tsx` | Static content in page | Server Component |
| `HowItWorks.tsx` | Static content in page | Server Component |
| `Pricing.tsx` | `app/(marketing)/components/pricing.tsx` | Client (checkout dialog) |
| `Testimonials.tsx` | Static content | Server Component |
| `Cta.tsx` | Static content | Server Component |
| `Footer.tsx` | `app/(marketing)/components/footer.tsx` | Server Component |
| `AuthModal.tsx` | `app/(auth)/components/auth-modal.tsx` | Client (dialog) |

### Dashboard Components

| Current | Next.js | Type |
|---|---|---|
| `DashboardLayout.tsx` | `app/(dashboard)/layout.tsx` | Server Component |
| `OnboardingAvailabilityStep.tsx` | `app/onboarding/components/availability-step.tsx` | Client |

### Booking Store

| Current | Next.js | Type |
|---|---|---|
| `BookingStorePage.tsx` | `app/(booking-store)/b/[slug]/page.tsx` | Client (interactivity) |
| Service picker, date picker, time slots, client form, confirmation | `app/(booking-store)/b/[slug]/components/` | Client Components |

---

## 11. Key Implementation Notes

### 1. Keep UI Identical

The shadcn/ui component library and Tailwind CSS patterns carry over 1:1. The only styling changes:

- Remove `import.meta.env` references → use `process.env` (server) or `NEXT_PUBLIC_*` (client)
- Replace `useNavigate` from wouter → use `useRouter` from `next/navigation` or `Link` from `next/link`
- Replace `useLocation` from wouter → `usePathname` from `next/navigation`

### 2. TanStack Query Still Needed

Server Components fetch data directly, but Client Components that manage interactive state (booking form steps, filters, modals) still benefit from TanStack Query for:

- Caching and background refetching
- Optimistic updates
- Infinite scroll / pagination
- Dependent queries

### 3. Google Calendar — Server-Side Only

OAuth tokens (refresh_token) are stored server-side in the database. Calendar sync always runs server-side via a Server Action triggered after booking creation. The client never sees Google tokens.

### 4. Phone Normalization

East Africa phone validation utility (reused across PayHero, client form):

```typescript
// src/lib/phone.ts
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

export function isValidEastAfricaPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return /^254[17]\d{8}$/.test(digits);
}
```

### 5. Trial Expiry Check

```typescript
// src/lib/subscription.ts
const TRIAL_DAYS = 7;

export function isTrialExpired(createdAt: string, plan: string): boolean {
  if (plan === "starter" || plan === "premium") return false;
  return Date.now() > new Date(createdAt).getTime() + TRIAL_DAYS * 86400000;
}

export function getTrialDaysRemaining(createdAt: string, plan: string): number {
  if (plan !== "trial") return 0;
  const expiry = new Date(createdAt).getTime() + TRIAL_DAYS * 86400000;
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400000));
}
```

### 6. Slug Generation

```typescript
// src/lib/slug.ts
export function slugFromBusinessName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}
```

### 7. InsForge Client Setup

```typescript
// src/lib/insforge.ts (server-side — uses service key)
import { createClient } from "@insforge/sdk";

let _adminClient: ReturnType<typeof createClient> | null = null;

export function getInsforgeAdmin() {
  if (!_adminClient) {
    _adminClient = createClient({
      baseUrl: process.env.INSFORGE_URL!,
      anonKey: process.env.INSFORGE_SERVICE_KEY!,
    });
  }
  return _adminClient;
}

// For user-specific queries (RLS-aware)
export function getInsforgeUser(token: string) {
  return createClient({
    baseUrl: process.env.INSFORGE_URL!,
    anonKey: token,
  });
}
```

```typescript
// src/lib/insforge-client.ts (client-side — uses anon key, public data only)
import { createClient } from "@insforge/sdk";

export const insforgeClient = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});
```

### 8. Environment Variables

```env
# InsForge
INSFORGE_URL=https://your-app.region.insforge.app
INSFORGE_SERVICE_KEY=eyJ...
NEXT_PUBLIC_INSFORGE_URL=https://your-app.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJ...

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# PayHero
PAYHERO_CHANNEL_ID=1234
PAYHERO_AUTH_TOKEN=...
PAYHERO_PASSWORD=...
PAYHERO_CALLBACK_URL=https://yourapp.com/api/webhooks/payhero

# Google Calendar OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourapp.com

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

---

## 12. Migration Phases

### Phase 1: Scaffold (1-2 days)
- Create Next.js 15 app with App Router
- Set up InsForge client, NextAuth, shadcn/ui
- Copy over all Tailwind config, CSS variables, design tokens
- Set up all shadcn/ui components
- Configure environment variables

### Phase 2: Public Pages (2-3 days)
- Landing page (`/`) — migrate all sections, preserve animations
- Auth pages (`/login`, `/signup`) — wire to NextAuth
- Booking store (`/b/[slug]`) — slot computation, booking flow
- Directory page (`/directory`)
- Community pages (waitlist, feedback, referral, help, etc.)

### Phase 3: Dashboard (3-5 days)
- Dashboard layout (sidebar, header)
- Services CRUD
- Bookings management (table, filters, status updates)
- Availability management
- Team management
- Analytics page
- Settings (multi-tab)

### Phase 4: Onboarding (1-2 days)
- 4-step wizard wired to Server Actions
- Profile creation, services setup, availability, launch

### Phase 5: Payments & Subscriptions (2-3 days)
- Paystack subscription flow (upgrade page, checkout, webhook)
- PayHero M-Pesa booking payments
- Subscription status management

### Phase 6: Integrations (1 day)
- Google Calendar OAuth (server-side)
- Google Calendar sync on booking create
- Webhook handlers

### Phase 7: Polish & Launch (2-3 days)
- Error handling and loading states
- Optimistic UI updates with TanStack Query
- ISR revalidation triggers
- Performance audit
- Deploy and test

---

## 13. What Stays the Same

- **All 55 shadcn/ui components** — copy them over, they work in Next.js
- **Tailwind CSS** — v3.4 (not v4), same config and utility classes
- **Design tokens** (CSS custom properties for colors, spacing, radii) — same
- **Framer Motion animations** — same API
- **Radix UI primitives** — same
- **React Hook Form + Zod** — same
- **Recharts** — same
- **Sonner toasts** — same
- **InsForge PostgreSQL schema** — no changes needed
- **Paystack + PayHero integration logic** — same, just in Server Actions
- **Google Calendar OAuth** — same flow
- **MCP server** — stays as separate app, doesn't change
