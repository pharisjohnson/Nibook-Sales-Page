-- profiles RLS: allow owners to read/update and public to read completed profiles

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can view own profile'
  ) then
    execute $pol$
      create policy "Users can view own profile"
        on public.profiles for select
        using (auth.uid() = id)
    $pol$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    execute $pol$
      create policy "Users can update own profile"
        on public.profiles for update
        using (auth.uid() = id)
    $pol$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Public profiles are viewable'
  ) then
    execute $pol$
      create policy "Public profiles are viewable"
        on public.profiles for select
        using (onboarding_completed = true)
    $pol$;
  end if;
end $$;
