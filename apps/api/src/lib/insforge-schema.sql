-- Nibook Database Schema for Insforge
-- Run this in your Insforge SQL editor to set up all tables + RLS

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  slug text unique,
  phone text,
  location text,
  bio text,
  category text,
  logo_url text,
  cover_url text,
  avatar_url text,
  onboarding_completed boolean default false,
  plan text default 'starter' check (plan in ('starter', 'premium', 'enterprise')),
  plan_expires_at timestamptz,
  mpesa_paybill text,
  mpesa_account text,
  whatsapp_enabled boolean default false,
  whatsapp_phone text,
  reminder_hours int default 24,
  cancellation_policy text,
  booking_widget_theme text default 'light',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Public profiles are viewable"
  on public.profiles for select using (onboarding_completed = true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, business_name)
  values (new.id, new.raw_user_meta_data->>'business_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- services
-- ─────────────────────────────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes int not null default 60,
  price numeric(10,2) not null default 0,
  currency text default 'KES',
  category text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

create policy "Owners can manage their services"
  on public.services for all using (auth.uid() = owner_id);
create policy "Anyone can view active services"
  on public.services for select using (is_active = true);

-- ─────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  client_name text not null,
  client_phone text,
  client_email text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  status text default 'pending' check (status in ('pending','confirmed','completed','cancelled','no-show')),
  notes text,
  amount numeric(10,2),
  payment_reference text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded')),
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Owners can manage their bookings"
  on public.bookings for all using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- availability_schedules
-- ─────────────────────────────────────────────
create table if not exists public.availability_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  day_name text not null check (day_name in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  is_active boolean default true,
  start_time text not null default '8:00 AM',
  end_time text not null default '6:00 PM',
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(owner_id, day_name)
);

alter table public.availability_schedules enable row level security;

create policy "Owners can manage their schedule"
  on public.availability_schedules for all using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- availability_blackouts
-- ─────────────────────────────────────────────
create table if not exists public.availability_blackouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  reason text default 'Time off',
  created_at timestamptz default now(),
  unique(owner_id, date)
);

alter table public.availability_blackouts enable row level security;

create policy "Owners can manage their blackout dates"
  on public.availability_blackouts for all using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- availability_rules
-- ─────────────────────────────────────────────
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null unique,
  buffer_minutes int default 15,
  min_notice_hours int default 2,
  max_advance_days int default 30,
  cancellation_window_hours int default 24,
  created_at timestamptz default now()
);

alter table public.availability_rules enable row level security;

create policy "Owners can manage their booking rules"
  on public.availability_rules for all using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- team_members
-- ─────────────────────────────────────────────
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  name text not null,
  email text not null,
  role text not null default 'Staff' check (role in ('Owner','Admin','Staff')),
  avatar_url text,
  status text default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now(),
  unique(owner_id, email)
);

alter table public.team_members enable row level security;

create policy "Owners can manage their team"
  on public.team_members for all using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- team_invites
-- ─────────────────────────────────────────────
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  role text not null default 'Staff' check (role in ('Admin','Staff')),
  token text unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique(owner_id, email)
);

alter table public.team_invites enable row level security;

create policy "Owners can manage their invites"
  on public.team_invites for all using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- waitlist
-- ─────────────────────────────────────────────
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;

create policy "Anyone can join waitlist"
  on public.waitlist for insert with check (true);
create policy "Service role can view waitlist"
  on public.waitlist for select using (true);

-- ─────────────────────────────────────────────
-- payments
-- ─────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  reference text unique not null,
  phone text,
  amount numeric(10,2) not null,
  plan text,
  provider text default 'm-pesa',
  status text default 'pending' check (status in ('pending','success','failed','cancelled')),
  payhero_response jsonb,
  callback_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Owners can view their payments"
  on public.payments for select using (auth.uid() = owner_id);
create policy "Service role can insert payments"
  on public.payments for insert with check (true);
create policy "Service role can update payments"
  on public.payments for update using (true);
