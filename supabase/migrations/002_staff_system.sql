-- ============================================================
-- 002_STAFF_SYSTEM.SQL
-- Phase 1 of the Premium HR & ATS Portal Expansion
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Extend Admin Roles to include Employees
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'employee';

-- 2. Staff Profiles Table
-- Stores personnel data for everyone hired
CREATE TABLE IF NOT EXISTS staff_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application_id      UUID REFERENCES applications(id),
  
  -- Personal Info
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  avatar_url          TEXT,
  phone               TEXT,
  nationality         TEXT,
  date_of_birth       DATE,
  
  -- Employment Details
  employee_id         TEXT UNIQUE, -- Aerojet Employee ID (e.g., AE-001)
  job_title           TEXT NOT NULL,
  department          TEXT NOT NULL,
  reporting_manager_id UUID REFERENCES staff_profiles(id),
  employment_status   TEXT NOT NULL DEFAULT 'active', -- active, on_leave, terminated
  employment_type     employment_type NOT NULL DEFAULT 'full_time',
  joined_at           DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Document Folders Table
-- For organizing employee documents (matching BambooHR)
CREATE TABLE IF NOT EXISTS document_folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT, -- Lucide icon name
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Staff Documents Table
-- Specific documents linked to a folder and an employee
CREATE TABLE IF NOT EXISTS staff_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id        UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  folder_id       UUID NOT NULL REFERENCES document_folders(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       TEXT, -- pdf, jpg, etc.
  file_size       INTEGER,
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed Default Folders
INSERT INTO document_folders (name, description, icon) VALUES
  ('Personal', 'ID scans, Passports, and personal IDs', 'user'),
  ('Qualifications', 'Certificates, Licences, and EASA ratings', 'award'),
  ('Contract & Legal', 'Signed employment contracts and NDAs', 'file-text'),
  ('Medical', 'Health clearances and medical reports', 'heart-pulse'),
  ('Miscellaneous', 'Other employee documents', 'folder'),
  ('Recruitment Scans', 'CVs, licence scans and passport scans from applications and talent pool', 'file-search')
ON CONFLICT DO NOTHING;

-- 6. RLS Policies for Staff Profiles
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Admins/HR can see everyone
CREATE POLICY "admin_all_staff" ON staff_profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager')));

-- Employees can see their own profile
CREATE POLICY "staff_own_profile" ON staff_profiles FOR SELECT
  USING (auth_user_id = auth.uid());

-- 7. RLS Policies for Documents
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- Admins/HR can manage all documents
CREATE POLICY "admin_all_docs" ON staff_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin', 'hr_manager')));

-- Employees can see their own documents
CREATE POLICY "staff_own_docs" ON staff_documents FOR SELECT
  USING (staff_id IN (SELECT id FROM staff_profiles WHERE auth_user_id = auth.uid()));

-- 8. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_staff_documents_updated_at BEFORE UPDATE ON staff_documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
