-- =========================
-- ENUM TYPES
-- =========================

create type chore_frequency as enum ('daily', 'weekly', 'monthly');

create type assignment_status as enum ('pending', 'in_progress', 'completed', 'overdue');

create type repair_status_type as enum ('pending', 'in_progress', 'completed', 'rejected');

create type repair_urgency as enum ('low', 'medium', 'high');
-----------------------------------------

-- =========================
-- ROLES TABLE
-- =========================

create table public.roles (
    role_id uuid not null default gen_random_uuid(),
    role_name text not null,

    constraint roles_pkey primary key (role_id),
    constraint roles_role_name_key unique (role_name)
);

-- =========================
-- PROFILES TABLE
-- =========================

create table public.profiles (
    user_id uuid not null default auth.uid(),
    name text not null,
    email text not null,
    role_id uuid not null,
    created_at timestamptz not null default now(),

    constraint profiles_pkey primary key (user_id),
    constraint profiles_email_key unique (email),
    constraint profiles_role_id_fkey 
        foreign key (role_id) 
        references public.roles (role_id) 
        on delete restrict
);


-- =========================
-- HOUSEHOLDS TABLE
-- =========================

create table public.households (
    household_id uuid not null default gen_random_uuid(),
    household_name text not null,
    join_code text not null,
    created_by uuid not null default auth.uid(),
    created_at timestamptz not null default now(),

    constraint households_pkey
        primary key (household_id),

    constraint households_join_code_key
        unique (join_code),

    constraint households_created_by_fkey
        foreign key (created_by)
        references public.profiles (user_id)
        on delete restrict
);

-- =========================
-- HOUSEHOLD_MEMBERS TABLE
-- =========================

create table public.household_members (
  user_id uuid not null,
  household_id uuid not null,
  joined_at timestamptz not null default now(),

  constraint household_members_pkey
    primary key (user_id, household_id),

  constraint unique_user_one_household
    unique (user_id),

  constraint household_members_user_id_fkey
    foreign key (user_id)
    references public.profiles (user_id)
    on delete cascade,

  constraint household_members_household_id_fkey
    foreign key (household_id)
    references public.households (household_id)
    on delete cascade
);

-- =========================
-- CHORES TABLE
-- =========================

create table public.chores (
    chore_id uuid not null default gen_random_uuid(),
    household_id uuid not null,
    title text not null,
    description text null,
    frequency public.chore_frequency not null,
    created_by uuid not null default auth.uid(),
    created_at timestamptz not null default now(),

    constraint chores_pkey
        primary key (chore_id),

    constraint unique_chore_title_per_household
        unique (household_id, title),

    constraint chores_household_id_fkey
        foreign key (household_id)
        references public.households (household_id)
        on delete cascade,

    constraint chores_created_by_fkey
        foreign key (created_by)
        references public.profiles (user_id)
        on delete restrict
);

-- =========================
-- CHORE_ASSIGNMENTS TABLE
-- =========================

create table public.chore_assignments (
    assignment_id uuid not null default gen_random_uuid(),
    chore_id uuid not null,
    assigned_to uuid not null,
    assigned_by uuid not null,
    week_start_date date not null,
    status public.assignment_status not null default 'pending'::assignment_status,
    completed_at timestamptz null,
    created_at timestamptz not null default now(),

    constraint chore_assignments_pkey
        primary key (assignment_id),

    constraint unique_chore_week
        unique (chore_id, week_start_date),

    constraint chore_assignments_chore_id_fkey
        foreign key (chore_id)
        references public.chores (chore_id)
        on delete cascade,

    constraint chore_assignments_assigned_to_fkey
        foreign key (assigned_to)
        references public.profiles (user_id)
        on delete restrict,

    constraint chore_assignments_assigned_by_fkey
        foreign key (assigned_by)
        references public.profiles (user_id)
        on delete restrict
);

-- =========================
-- REPAIR_REQUESTS TABLE
-- =========================

create table public.repair_requests (
    repair_id uuid not null default gen_random_uuid(),
    household_id uuid not null,
    submitted_by uuid not null default auth.uid(),
    title text not null,
    description text not null,
    location text not null,
    urgency public.repair_urgency not null default 'low'::repair_urgency,
    status public.repair_status_type not null default 'pending'::repair_status_type,
    resolution_notes text null,
    resolved_by uuid null,
    resolved_at timestamptz null,
    created_at timestamptz not null default now(),

    constraint repair_requests_pkey
        primary key (repair_id),

    constraint repair_requests_household_id_fkey
        foreign key (household_id)
        references public.households (household_id)
        on delete cascade,

    constraint repair_requests_submitted_by_fkey
        foreign key (submitted_by)
        references public.profiles (user_id)
        on delete restrict,

    constraint repair_requests_resolved_by_fkey
        foreign key (resolved_by)
        references public.profiles (user_id)
        on delete set null
);

-- =========================
-- REPAIR_IMAGES TABLE
-- =========================

create table public.repair_images (
    image_id uuid not null default gen_random_uuid(),
    repair_id uuid not null,
    image_url text not null,
    uploaded_by uuid not null default auth.uid(),
    created_at timestamptz not null default now(),

    constraint repair_images_pkey
        primary key (image_id),

    constraint repair_images_repair_id_fkey
        foreign key (repair_id)
        references public.repair_requests (repair_id)
        on delete cascade,

    constraint repair_images_uploaded_by_fkey
        foreign key (uploaded_by)
        references public.profiles (user_id)
        on delete restrict
);

-- =========================
-- REPAIR_STATUS (HISTORY TABLE)
-- =========================

create table public.repair_status (
    status_id uuid not null default gen_random_uuid(),
    repair_id uuid not null,
    status public.repair_status_type not null default 'pending'::public.repair_status_type,
    changed_by uuid not null,
    changed_at timestamptz not null default now(),

    constraint repair_status_pkey
        primary key (status_id),

    constraint repair_status_repair_id_fkey
        foreign key (repair_id)
        references public.repair_requests (repair_id)
        on delete cascade,

    constraint repair_status_changed_by_fkey
        foreign key (changed_by)
        references public.profiles (user_id)
        on delete restrict
);