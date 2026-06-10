-- Migration: create service_questions table linked to services
-- Created: 2026-05-29

BEGIN;

CREATE TABLE IF NOT EXISTS public.service_questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text', -- 'text', 'number', 'yes_no', 'multiple_choice'
  options jsonb, -- for multiple_choice: JSON array of choices
  required boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

alter table public.service_questions enable row level security;

create index if not exists idx_service_questions_service_id on public.service_questions(service_id);
create index if not exists idx_service_questions_owner_id on public.service_questions(owner_id);

-- RLS policies
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='service_questions' and policyname='Owners can manage their service questions') then
    execute $p$ create policy "Owners can manage their service questions" on public.service_questions for all using (auth.uid() = owner_id) $p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='service_questions' and policyname='Public can view service questions') then
    execute $p$ create policy "Public can view service questions" on public.service_questions for select using (true) $p$;
  end if;
end $$;

-- attach updated_at trigger
drop trigger if exists trg_service_questions_updated_at on public.service_questions;
create trigger trg_service_questions_updated_at
  before update on public.service_questions
  for each row execute function public.set_updated_at();

COMMIT;
