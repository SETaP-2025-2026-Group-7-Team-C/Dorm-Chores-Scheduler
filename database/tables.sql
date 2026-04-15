-- =========================
-- ENUM TYPES
-- =========================
do $ $ begin if not exists (
    select
        1
    from
        pg_type
    where
        typname = 'availability_status_type'
) then create type availability_status_type as enum ('available', 'unavailable');end if;end $ $;do $ $ begin if not exists (
    select
        1
    from
        pg_type
    where
        typname = 'repair_status_type'
) then create type repair_status_type as enum (
    'pending',
    'in_progress',
    'completed',
    'rejected'
);end if;end $ $;do $ $ begin if not exists (
    select
        1
    from
        pg_type
    where
        typname = 'repair_urgency'
) then create type repair_urgency as enum ('low', 'medium', 'high');end if;end $ $;-- =========================
-- PROFILES TABLE
-- =========================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text check (char_length(display_name) > 0),
    is_manager boolean not null default false,
    avatar_url text,
    created_at timestamptz not null default now(),
    availability_status availability_status_type not null default 'available',
    is_deleted boolean not null default false,
    deleted_at timestamptz
);

-- =========================
-- DORMS TABLE
-- =========================
create table if not exists public.dorms (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    join_code text not null unique,
    created_by uuid not null references public.profiles(id) on delete restrict,
    created_at timestamptz not null default now()
);-- =========================
-- DORM_MEMBERS TABLE
-- =========================
create table if not exists public.dorm_members (
    user_id uuid not null references public.profiles(id) on delete cascade,
    dorm_id uuid not null references public.dorms(id) on delete cascade,
    joined_at timestamptz not null default now(),
    constraint dorm_members_pkey primary key (user_id, dorm_id),
    constraint unique_user_one_dorm unique (user_id)
);-- =========================
-- CHORES TABLE
-- =========================
create table if not exists public.chores (
    id uuid primary key default gen_random_uuid(),
    dorm_id uuid not null references public.dorms(id) on delete cascade,
    title text not null,
    description text,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    due_in_days integer
);-- =========================
-- InApp notification TABLE
-- =========================
create table if not exists public.in_app_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);-- =========================
-- REPAIR_REQUESTS TABLE
-- =========================
create table if not exists public.repair_requests (
    id uuid primary key default gen_random_uuid(),
    dorm_id uuid not null references public.dorms(id) on delete cascade,
    submitted_by uuid not null references public.profiles(id) on delete restrict,
    title text not null,
    description text not null,
    location text not null,
    urgency repair_urgency not null default 'low',
    status repair_status_type not null default 'pending',
    resolution_notes text,
    resolved_by uuid references public.profiles(id) on delete
    set
        null,
        resolved_at timestamptz,
        created_at timestamptz not null default now()
);-- =========================
-- REPAIR_IMAGES TABLE
-- =========================
create table if not exists public.repair_images (
    id uuid primary key default gen_random_uuid(),
    repair_id uuid not null references public.repair_requests(id) on delete cascade,
    image_url text not null,
    uploaded_by uuid not null references public.profiles(id) on delete restrict,
    created_at timestamptz not null default now()
);-- =========================
-- REPAIR_STATUS HISTORY TABLE
-- =========================
create table if not exists public.repair_status (
    id uuid primary key default gen_random_uuid(),
    repair_id uuid not null references public.repair_requests(id) on delete cascade,
    status repair_status_type not null default 'pending',
    changed_by uuid not null references public.profiles(id) on delete restrict,
    changed_at timestamptz not null default now()
);-- =========================
-- NOTIFICATION PREFERENCES
-- =========================
create table if not exists public.notification_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preferences jsonb default '{}'
);