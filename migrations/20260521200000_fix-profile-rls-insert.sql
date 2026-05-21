-- Allow authenticated users to insert their own profile row.
-- Without this policy the upsert in the onboarding PATCH route would fail
-- whenever the on_auth_user_created trigger did not fire (e.g. InsForge env).
-- The check (auth.uid() = id) ensures a user can only create their own profile.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    execute $pol$
      create policy "Users can insert own profile"
        on public.profiles
        for insert
        with check (auth.uid() = id)
    $pol$;
  end if;
end $$;
