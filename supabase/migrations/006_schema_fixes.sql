-- ============================================================
-- 006_SCHEMA_FIXES.SQL
-- Resolves missing tables identified during the schema audit
-- and adds missing foreign keys for the staff directory.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. System Settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT,
  updated_by    UUID REFERENCES auth.users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initial seed for system settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('company_name', 'Aerojet Aviation Group'),
  ('portal_status', 'Operational'),
  ('base_location', 'Accra Base, GH'),
  ('enterprise_logo_url', '/images/aalogowhite-BCKBvd3h.png')
ON CONFLICT DO NOTHING;

-- ── 2. Departments & Budgets ──────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  code            TEXT,
  manager_id      UUID REFERENCES admin_users(id),
  current_budget  NUMERIC(14,2),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department_budget_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  amount        NUMERIC(14,2),
  prev_amount   NUMERIC(14,2),
  change_reason TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Dashboard Snapshots ────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name   TEXT NOT NULL,
  metric_value  NUMERIC NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (metric_name, snapshot_date)
);

-- ── 4. Metadata Lookup Tables ─────────────────────────────────
-- Replaces pure DB ENUMs with lookup tables for the front-end API
CREATE TABLE IF NOT EXISTS job_categories (
  value       TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employment_types (
  value       TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed metadata lookups to match existing ENUMs
INSERT INTO job_categories (value, label) VALUES
  ('experienced_professional', 'Experienced Professional'),
  ('graduate_program', 'Graduate Program'),
  ('skilled_training', 'Skilled Training'),
  ('general_application', 'General Application')
ON CONFLICT DO NOTHING;

INSERT INTO employment_types (value, label) VALUES
  ('full_time', 'Full Time'),
  ('part_time', 'Part Time'),
  ('contract', 'Contract'),
  ('trainee', 'Trainee'),
  ('internship', 'Internship')
ON CONFLICT DO NOTHING;

-- ── 5. Staff Profiles FK Link ─────────────────────────────────
-- Explicitly link staff_profiles to admin_users for PostgREST auto-joins
ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES admin_users(id),
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Backfill admin_user_id for existing profiles based on auth_user_id
UPDATE staff_profiles sp
SET admin_user_id = au.id
FROM admin_users au
WHERE sp.auth_user_id = au.auth_user_id
  AND sp.admin_user_id IS NULL;

-- ── 6. RLS Policies ───────────────────────────────────────────
-- (Assuming full admin access required for these tables based on standard patterns)
ALTER TABLE system_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_budget_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_types          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_system_settings" ON system_settings;
CREATE POLICY "admin_all_system_settings" ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager'))
);

DROP POLICY IF EXISTS "admin_all_departments" ON departments;
CREATE POLICY "admin_all_departments" ON departments FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager'))
);

DROP POLICY IF EXISTS "admin_all_dept_budgets" ON department_budget_history;
CREATE POLICY "admin_all_dept_budgets" ON department_budget_history FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager'))
);

DROP POLICY IF EXISTS "admin_all_dash_snaps" ON dashboard_snapshots;
CREATE POLICY "admin_all_dash_snaps" ON dashboard_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager', 'recruiter'))
);

-- Public can read metadata lookups
DROP POLICY IF EXISTS "public_read_job_cat" ON job_categories;
CREATE POLICY "public_read_job_cat"  ON job_categories   FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "public_read_emp_type" ON employment_types;
CREATE POLICY "public_read_emp_type" ON employment_types FOR SELECT USING (is_active = true);

-- Admins can update metadata lookups
DROP POLICY IF EXISTS "admin_all_job_cat" ON job_categories;
CREATE POLICY "admin_all_job_cat" ON job_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager'))
);

DROP POLICY IF EXISTS "admin_all_emp_type" ON employment_types;
CREATE POLICY "admin_all_emp_type" ON employment_types FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager'))
);
