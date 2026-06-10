-- Migration: add image_urls column to services table
-- Created: 2026-05-29
-- Purpose: Support up to 2 photos per service (replaces single image_url)

BEGIN;

-- Add image_urls as JSONB array for multiple service photos
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;

-- Migrate existing image_url values into image_urls array
UPDATE public.services
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_urls = '[]'::jsonb;

-- Add check constraint: max 2 images
ALTER TABLE public.services ADD CONSTRAINT chk_services_max_images
  CHECK (jsonb_array_length(image_urls) <= 2);

-- Add index for services with images (useful for directory/booking store queries)
CREATE INDEX IF NOT EXISTS idx_services_has_images ON public.services
  USING GIN (image_urls) WHERE jsonb_array_length(image_urls) > 0;

-- Add missing RLS policies for services table (original migration enabled RLS but never added policies)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='services' and policyname='Owners can manage their services') then
    execute $p$ create policy "Owners can manage their services" on public.services for all using (auth.uid() = owner_id) $p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='services' and policyname='Public can view active services') then
    execute $p$ create policy "Public can view active services" on public.services for select using (is_active = true) $p$;
  end if;
end $$;

COMMIT;
