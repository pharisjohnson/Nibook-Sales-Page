alter table public.profiles add column if not exists show_cancellation_policy boolean default true;
alter table public.profiles add column if not exists support_channel text default 'email';
alter table public.profiles add column if not exists support_email text;
