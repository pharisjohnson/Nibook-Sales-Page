-- Relax NOT NULL on new-schema columns that the app's insert path does not populate.
-- Live DB drifted ahead of the app code (provider_id/customer_id/start_at/end_at/total_cents
-- were added with NOT NULL and no defaults), which broke ALL service and booking creation.
-- Fix: drop the NOT NULL constraints so the app's existing insert shape works again.
-- Foreign keys stay intact; the provider_id FK to providers(id) remains valid (NULL allowed).

alter table public.services alter column provider_id drop not null;
alter table public.services alter column slug drop not null;
alter table public.services alter column duration_min drop not null;
alter table public.services alter column price_cents drop not null;

alter table public.bookings alter column service_id drop not null;
alter table public.bookings alter column provider_id drop not null;
alter table public.bookings alter column customer_id drop not null;
alter table public.bookings alter column start_at drop not null;
alter table public.bookings alter column end_at drop not null;
alter table public.bookings alter column total_cents drop not null;
