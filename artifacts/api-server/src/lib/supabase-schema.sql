-- Nibook Supabase Schema
-- Run this in your Supabase SQL editor to set up tables + RLS

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- profiles (extends auth.users)
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
  onboarding_completed boolean default false,
  plan text default 'starter' check (plan in ('starter', 'premium', 'enterprise')),
  plan_expires_at timestamptz,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Migration: add new columns if they don't exist (safe to re-run)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='location') then
    alter table public.profiles add column location text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='bio') then
    alter table public.profiles add column bio text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='category') then
    alter table public.profiles add column category text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='logo_url') then
    alter table public.profiles add column logo_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='cover_url') then
    alter table public.profiles add column cover_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='onboarding_completed') then
    alter table public.profiles add column onboarding_completed boolean default false;
  end if;
end $$;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, business_name)
  values (new.id, new.raw_user_meta_data->>'business_name');
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

-- ─────────────────────────────────────────────
-- visitors (check-in log)
-- ─────────────────────────────────────────────
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  company text,
  host_id uuid references public.profiles(id) on delete set null,
  purpose text,
  consent_marketing boolean default false,
  consent_data_sharing boolean default false,
  badge_number text,
  checked_in_at timestamptz default now()
);

alter table public.visitors enable row level security;

create policy "Service role can insert visitors"
  on public.visitors for insert with check (true);

create policy "Service role can view visitors"
  on public.visitors for select using (true);

-- ─────────────────────────────────────────────
-- appointments (pre-registration tokens)
-- ─────────────────────────────────────────────
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  pre_reg_token text unique not null,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  host_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

alter table public.appointments enable row level security;

create policy "Service role can manage appointments"
  on public.appointments for all using (true);
