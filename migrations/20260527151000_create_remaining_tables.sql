-- Create remaining tables needed for the app to function
-- These are safe to run even if some already exist.

-- Helper for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── availability_schedules ────────────────────────────
create table if not exists public.availability_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  day_name text not null check (day_name in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  is_active boolean default true,
  start_time text not null default '08:00',
  end_time text not null default '18:00',
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(owner_id, day_name)
);

alter table public.availability_schedules enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='availability_schedules' and policyname='Owners can manage their schedule') then
    execute $p$ create policy "Owners can manage their schedule" on public.availability_schedules for all using (auth.uid() = owner_id) $p$;
  end if;
end $$;

-- ── availability_blackouts ────────────────────────────
create table if not exists public.availability_blackouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  reason text default 'Time off',
  created_at timestamptz default now(),
  unique(owner_id, date)
);

alter table public.availability_blackouts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='availability_blackouts' and policyname='Owners can manage their blackout dates') then
    execute $p$ create policy "Owners can manage their blackout dates" on public.availability_blackouts for all using (auth.uid() = owner_id) $p$;
  end if;
end $$;

-- ── availability_rules ────────────────────────────────
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

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='availability_rules' and policyname='Owners can manage their booking rules') then
    execute $p$ create policy "Owners can manage their booking rules" on public.availability_rules for all using (auth.uid() = owner_id) $p$;
  end if;
end $$;

-- ── bookings ──────────────────────────────────────────
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

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bookings' and policyname='Owners can manage their bookings') then
    execute $p$ create policy "Owners can manage their bookings" on public.bookings for all using (auth.uid() = owner_id) $p$;
  end if;
end $$;

-- ── payments ──────────────────────────────────────────
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
  provider_response jsonb,
  callback_payload jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Owners can view their payments') then
    execute $p$ create policy "Owners can view their payments" on public.payments for select using (auth.uid() = owner_id) $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Service role can insert payments') then
    execute $p$ create policy "Service role can insert payments" on public.payments for insert with check (true) $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Service role can update payments') then
    execute $p$ create policy "Service role can update payments" on public.payments for update using (true) $p$;
  end if;
end $$;

-- ── workspace_settings ────────────────────────────────
create table if not exists public.workspace_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null unique,
  settings jsonb default '{}'::jsonb,
  booking_rules jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workspace_settings enable row level security;

-- ── team_members ──────────────────────────────────────
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

-- ── team_invites ──────────────────────────────────────
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

-- ── subscriptions ─────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null,
  status text default 'active' check (status in ('active','past_due','cancelled')),
  started_at timestamptz default now(),
  expires_at timestamptz,
  provider_meta jsonb,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- ── usage_metrics ─────────────────────────────────────
create table if not exists public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  metric text not null,
  value int default 0,
  window_start timestamptz default now(),
  created_at timestamptz default now(),
  unique(owner_id, metric)
);

alter table public.usage_metrics enable row level security;

-- ── indexes ───────────────────────────────────────────
create index if not exists idx_services_owner on public.services(owner_id);
create index if not exists idx_bookings_owner on public.bookings(owner_id);
create index if not exists idx_payments_owner on public.payments(owner_id);

-- ── updated_at triggers ───────────────────────────────
drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_workspace_settings_updated_at on public.workspace_settings;
create trigger trg_workspace_settings_updated_at
  before update on public.workspace_settings
  for each row execute function public.set_updated_at();
