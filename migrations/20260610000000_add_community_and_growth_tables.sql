-- Migration: Add community and growth tables (Waitlist, Reviews, Feedback, Referrals)
-- Generated: 2026-06-10 00:00:00

BEGIN;

-- ── waitlist ──────────────────────────────────────────
-- For users wanting to be notified about the app or specific businesses
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  business_slug text, -- Optional: if they are waiting for a specific business
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'joined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, business_slug)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS: Public can sign up for waitlist, Admins can manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='Public can join waitlist') THEN
    EXECUTE $p$ CREATE POLICY "Public can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='Admins can manage waitlist') THEN
    EXECUTE $p$ CREATE POLICY "Admins can manage waitlist" ON public.waitlist FOR ALL USING (auth.role() = 'service_role') $p$;
  END IF;
END $$;

-- ── reviews ──────────────────────────────────────────
-- For customer testimonials and service ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view published reviews, Public can submit, Owners can manage their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Public can view published reviews') THEN
    EXECUTE $p$ CREATE POLICY "Public can view published reviews" ON public.reviews FOR SELECT USING (is_published = true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Public can submit reviews') THEN
    EXECUTE $p$ CREATE POLICY "Public can submit reviews" ON public.reviews FOR INSERT WITH CHECK (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Owners can manage their reviews') THEN
    EXECUTE $p$ CREATE POLICY "Owners can manage their reviews" ON public.reviews FOR ALL USING (auth.uid() = business_id) $p$;
  END IF;
END $$;

-- ── feedback ──────────────────────────────────────────
-- For app feedback and feature requests
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('bug', 'suggestion', 'general', 'feature_request')),
  content text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implemented', 'declined')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS: Public can submit feedback, Admins can manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feedback' AND policyname='Public can submit feedback') THEN
    EXECUTE $p$ CREATE POLICY "Public can submit feedback" ON public.feedback FOR INSERT WITH CHECK (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feedback' AND policyname='Admins can manage feedback') THEN
    EXECUTE $p$ CREATE POLICY "Admins can manage feedback" ON public.feedback FOR ALL USING (auth.role() = 'service_role') $p$;
  END IF;
END $$;

-- ── referrals ──────────────────────────────────────────
-- Tracking growth and referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  referral_code text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  reward_granted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_email)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS: Owners can see their own referrals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Owners can view their referrals') THEN
    EXECUTE $p$ CREATE POLICY "Owners can view their referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='referrals' AND policyname='Admins can manage referrals') THEN
    EXECUTE $p$ CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (auth.role() = 'service_role') $p$;
  END IF;
END $$;

-- ── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback(category);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

-- ── Triggers ──────────────────────────────────────────
-- Reuse the existing set_updated_at function from previous migrations
DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.feedback;
CREATE TRIGGER trg_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_referrals_updated_at ON public.referrals;
CREATE TRIGGER trg_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
