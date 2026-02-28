-- =========================
-- INDEXES
-- =========================
-- Purpose: speed up common queries + foreign key lookups
-- Note: PK/UNIQUE constraints already create indexes automatically.

-- Household membership lookups
create index if not exists idx_household_members_household_id
    on public.household_members (household_id);

-- Chores lookups
create index if not exists idx_chores_household_id
    on public.chores (household_id);

create index if not exists idx_chores_created_by
    on public.chores (created_by);

-- Chore assignments lookups
create index if not exists idx_chore_assignments_chore_id
    on public.chore_assignments (chore_id);

create index if not exists idx_chore_assignments_assigned_to
    on public.chore_assignments (assigned_to);

create index if not exists idx_chore_assignments_assigned_by
    on public.chore_assignments (assigned_by);

create index if not exists idx_chore_assignments_week_start_date
    on public.chore_assignments (week_start_date);

create index if not exists idx_chore_assignments_status
    on public.chore_assignments (status);

-- Repair requests lookups
create index if not exists idx_repair_requests_household_id
    on public.repair_requests (household_id);

create index if not exists idx_repair_requests_submitted_by
    on public.repair_requests (submitted_by);

create index if not exists idx_repair_requests_resolved_by
    on public.repair_requests (resolved_by);

create index if not exists idx_repair_requests_status
    on public.repair_requests (status);

create index if not exists idx_repair_requests_urgency
    on public.repair_requests (urgency);

create index if not exists idx_repair_requests_created_at
    on public.repair_requests (created_at desc);

-- Repair images lookups
create index if not exists idx_repair_images_repair_id
    on public.repair_images (repair_id);

create index if not exists idx_repair_images_uploaded_by
    on public.repair_images (uploaded_by);

-- Repair status history lookups
create index if not exists idx_repair_status_repair_id
    on public.repair_status (repair_id);

create index if not exists idx_repair_status_changed_by
    on public.repair_status (changed_by);

-- Best for "show history for one repair newest-first"
create index if not exists idx_repair_status_repair_changed_at
    on public.repair_status (repair_id, changed_at desc);