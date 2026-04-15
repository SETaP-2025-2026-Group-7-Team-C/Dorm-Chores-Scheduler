create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    is_manager,
    created_at
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), 'User'),
    coalesce((new.raw_user_meta_data->>'is_manager')::boolean, false),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();