-- =========================
-- REFERENCE DATA
-- =========================
-- Purpose: insert fixed values (roles)
-- Note: role_name is UNIQUE so this won't allow duplicates.

insert into public.roles (role_name)
values
    ('student'),
    ('manager')
on conflict (role_name) do nothing;