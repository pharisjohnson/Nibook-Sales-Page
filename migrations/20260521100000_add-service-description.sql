-- Add description column to services for richer service details
alter table public.services add column if not exists description text;
