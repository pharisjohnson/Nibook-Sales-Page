-- Add plan column if missing, then set constraint to trial/starter/premium only
alter table public.profiles add column if not exists plan text;

-- Drop old constraint if it exists (from enterprise era)
alter table public.profiles drop constraint if exists profiles_plan_check;

-- Add the new constraint with trial/starter/premium only
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('trial', 'starter', 'premium'));

-- Default new profiles to trial
alter table public.profiles alter column plan set default 'trial';

-- Also add other missing columns from the original schema
alter table public.profiles add column if not exists plan_expires_at timestamptz;
alter table public.profiles add column if not exists mpesa_paybill text;
alter table public.profiles add column if not exists mpesa_account text;
alter table public.profiles add column if not exists whatsapp_enabled boolean default false;
alter table public.profiles add column if not exists whatsapp_phone text;
alter table public.profiles add column if not exists reminder_hours int default 24;
alter table public.profiles add column if not exists cancellation_policy text;
alter table public.profiles add column if not exists booking_widget_theme text default 'light';
alter table public.profiles add column if not exists avatar_url text;
