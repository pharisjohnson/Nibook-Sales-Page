-- Add subscription columns to profiles table

-- Add subscription_plan column
alter table public.profiles add column if not exists subscription_plan text;

-- Add subscription_status column with check constraint
alter table public.profiles add column if not exists subscription_status text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_subscription_status_check') then
    alter table public.profiles add constraint profiles_subscription_status_check 
      check (subscription_status in ('active', 'cancelled', 'past_due', 'incomplete'));
  end if;
end $$;

-- Add paystack_customer_code column
alter table public.profiles add column if not exists paystack_customer_code text;

-- Add subscription_code column
alter table public.profiles add column if not exists subscription_code text;

-- Add subscription_started_at column
alter table public.profiles add column if not exists subscription_started_at timestamptz;
