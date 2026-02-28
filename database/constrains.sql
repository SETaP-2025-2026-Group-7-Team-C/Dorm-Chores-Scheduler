-- =========================
-- ADDITIONAL BUSINESS CONSTRAINTS
-- =========================
-- Purpose: enforce application-level business rules at database level
-- These are NOT PK/FK constraints (those are inside schema.sql)

-- ========================================
-- Repair resolution consistency
-- ========================================
-- If repair is resolved:
--   resolved_at AND resolved_by must BOTH be set.
-- If not resolved:
--   both must be NULL.

alter table public.repair_requests
add constraint repair_requests_resolution_consistent
check (
    (resolved_at is null and resolved_by is null)
    or
    (resolved_at is not null and resolved_by is not null)
);

-- ========================================
-- Prevent blank household names
-- ========================================

alter table public.households
add constraint households_name_not_blank
check (length(trim(household_name)) > 0);

-- ========================================
-- 3 Prevent blank chore titles
-- ========================================

alter table public.chores
add constraint chores_title_not_blank
check (length(trim(title)) > 0);

-- ========================================
--  Prevent blank repair titles
-- ========================================

alter table public.repair_requests
add constraint repair_requests_title_not_blank
check (length(trim(title)) > 0);

-- ========================================
--  Prevent blank join codes
-- ========================================

alter table public.households
add constraint households_join_code_not_blank
check (length(trim(join_code)) > 0);
