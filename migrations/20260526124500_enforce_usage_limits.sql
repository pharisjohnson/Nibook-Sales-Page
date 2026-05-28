-- Migration: Enforce basic usage limits (services and bookings)
-- Generated: 2026-05-26 12:45:00

create or replace function public.can_add_service(p_owner uuid)
returns boolean language plpgsql security definer as $$
declare
  v_plan text;
  v_count int;
begin
  select plan into v_plan from public.profiles where id = p_owner;
  if v_plan is null then
    return false;
  end if;

  if lower(v_plan) in ('starter', 'premium') then
    return true;
  end if;

  select count(*) into v_count from public.services where owner_id = p_owner;

  if v_count >= 3 then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.can_create_booking(p_owner uuid, p_when timestamptz)
returns boolean language plpgsql security definer as $$
declare
  v_plan text;
  v_count int;
  v_month_start timestamptz := date_trunc('month', p_when);
  v_month_end timestamptz := (date_trunc('month', p_when) + interval '1 month');
begin
  select plan into v_plan from public.profiles where id = p_owner;
  if v_plan is null then
    return false;
  end if;

  if lower(v_plan) = 'premium' then
    return true;
  end if;

  select count(*) into v_count from public.bookings where owner_id = p_owner and scheduled_at >= v_month_start and scheduled_at < v_month_end;

  if lower(v_plan) = 'starter' then
    if v_count >= 100 then
      return false;
    end if;
  else
    if v_count >= 10 then
      return false;
    end if;
  end if;

  return true;
end;
$$;

-- Create RLS policies to invoke these checks on INSERT
alter table public.services enable row level security;
drop policy if exists enforce_service_quota on public.services;
create policy enforce_service_quota on public.services
  for insert with check (public.can_add_service(owner_id));

alter table public.bookings enable row level security;
drop policy if exists enforce_booking_quota on public.bookings;
create policy enforce_booking_quota on public.bookings
  for insert with check (public.can_create_booking(owner_id, scheduled_at));

-- Note: these checks can be tuned per-plan; consider adding a `plan_limits` table for finer control.
