-- Signup stores business name as auth `name` / user_metadata.name, not business_name.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, business_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'business_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(trim(new.name), '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
