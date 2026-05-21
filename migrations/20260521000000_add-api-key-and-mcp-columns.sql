-- Add api_key column to profiles for MCP remote HTTP access
alter table public.profiles add column if not exists api_key text;

-- Unique index so lookup by api_key is fast and collision-safe
create unique index if not exists profiles_api_key_idx on public.profiles (api_key)
  where api_key is not null;

-- Add google OAuth columns if not already present (added in integrations feature)
alter table public.profiles add column if not exists google_refresh_token text;
alter table public.profiles add column if not exists google_access_token text;
alter table public.profiles add column if not exists google_token_expiry timestamptz;
alter table public.profiles add column if not exists google_calendar_email text;

-- Add payout columns if not already present
alter table public.profiles add column if not exists payout_mobile text;
alter table public.profiles add column if not exists payout_bank_name text;
alter table public.profiles add column if not exists payout_bank_account text;
alter table public.profiles add column if not exists payout_account_name text;
