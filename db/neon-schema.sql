-- ============================================================
-- AEROJET AVIATION — NEON (plain PostgreSQL) SCHEMA
-- Ported from the Supabase schema (supabase/migrations/001..007).
--
-- Differences vs Supabase:
--   * No Supabase Auth: a local `auth_users` table replaces auth.users
--     and stores a bcrypt password_hash.
--   * No Row Level Security (access is enforced in the app layer via
--     JWT + verifyRole, using the service-role-equivalent connection).
--   * No Supabase Storage: a local `storage_objects` table holds file
--     bytes, served through /api/files.
--
-- Safe to run multiple times (IF NOT EXISTS / idempotent guards).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Refresh token store (for session refresh flow) ─────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token         TEXT PRIMARY KEY,
  auth_user_id  UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user   ON refresh_tokens(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ── Enums (guarded so re-runs don't fail) ─────────────────────
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'new','under_review','shortlisted','interview',
    'offer','hired','rejected','transferred_to_hr','withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft','open','paused','closed','filled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_category AS ENUM ('experienced_professional','graduate_program','skilled_training','general_application');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('full_time','part_time','contract','trainee','internship');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin','admin','hr_manager','recruiter','read_only','employee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hr_platform AS ENUM ('bamboohr','workday','sap','zoho','csv','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('cv','licence_scan','passport_scan','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── auth_users (replaces Supabase auth.users) ─────────────────
CREATE TABLE IF NOT EXISTS auth_users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  user_metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_confirmed  BOOLEAN NOT NULL DEFAULT TRUE,
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── admin_users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  role         admin_role NOT NULL DEFAULT 'recruiter',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── jobs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_code        TEXT UNIQUE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  department      TEXT NOT NULL,
  category        job_category NOT NULL DEFAULT 'experienced_professional',
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  location        TEXT NOT NULL DEFAULT 'Accra, Ghana (KIA)',
  status          job_status NOT NULL DEFAULT 'draft',
  target_count    INTEGER,
  summary         TEXT,
  responsibilities TEXT,
  requirements    TEXT,
  what_we_offer   TEXT,
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  tags            TEXT[] DEFAULT '{}',
  closes_at       DATE,
  published_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES admin_users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── applications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_code             TEXT UNIQUE,
  job_id               UUID REFERENCES jobs(id) ON DELETE SET NULL,
  job_title            TEXT,
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  email                TEXT NOT NULL,
  phone                TEXT NOT NULL,
  nationality          TEXT NOT NULL,
  country_of_residence TEXT NOT NULL,
  date_of_birth        DATE,
  has_valid_passport   BOOLEAN,
  deployment_pref      TEXT NOT NULL DEFAULT 'fully_flexible',
  location_restrictions TEXT,
  availability         TEXT,
  status               application_status NOT NULL DEFAULT 'new',
  priority             INTEGER DEFAULT 3,
  source               TEXT,
  assigned_to          UUID REFERENCES admin_users(id),
  recruiter_notes      JSONB,
  rejection_reason     TEXT,
  hr_transferred       BOOLEAN NOT NULL DEFAULT FALSE,
  hr_transferred_at    TIMESTAMPTZ,
  hr_employee_id       TEXT,
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at          TIMESTAMPTZ,
  shortlisted_at       TIMESTAMPTZ,
  hired_at             TIMESTAMPTZ,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── application_qualifications ────────────────────────────────
CREATE TABLE IF NOT EXISTS application_qualifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id        UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  licence_type          TEXT,
  licence_number        TEXT,
  issuing_authority     TEXT,
  licence_expiry        DATE,
  type_ratings          TEXT[] DEFAULT '{}',
  other_type_ratings    TEXT,
  certifications        TEXT[] DEFAULT '{}',
  highest_qualification TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── application_experience ────────────────────────────────────
CREATE TABLE IF NOT EXISTS application_experience (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  current_employer TEXT NOT NULL,
  job_title        TEXT,
  role_start_date  DATE,
  role_end_date    DATE,
  total_years_exp  TEXT,
  work_types       TEXT[] DEFAULT '{}',
  outstation_exp   TEXT,
  stations_worked  TEXT,
  notice_period    TEXT,
  motivation       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── application_compensation ──────────────────────────────────
CREATE TABLE IF NOT EXISTS application_compensation (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id          UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  current_salary          NUMERIC(12,2),
  current_salary_currency TEXT DEFAULT 'USD',
  current_benefits        TEXT[] DEFAULT '{}',
  total_package_approx    NUMERIC(12,2),
  expected_min_usd        NUMERIC(12,2),
  expected_target_usd     NUMERIC(12,2),
  payment_preference      TEXT,
  accommodation_important TEXT,
  deployment_arrangement  TEXT,
  earliest_start_date     DATE,
  additional_notes        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── application_documents ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS application_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type   doc_type NOT NULL,
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       INTEGER,
  mime_type       TEXT,
  storage_bucket  TEXT NOT NULL DEFAULT 'application-documents',
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── pipeline_events (application_id nullable per migration 007) ─
CREATE TABLE IF NOT EXISTS pipeline_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  admin_user_id  UUID REFERENCES admin_users(id),
  event_type     TEXT NOT NULL,
  from_status    TEXT,
  to_status      TEXT,
  note           TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── hr_transfers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_transfers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  initiated_by   UUID REFERENCES admin_users(id),
  platform       hr_platform NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  payload        JSONB,
  external_id    TEXT,
  response_code  INTEGER,
  error_message  TEXT,
  attempted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ── talent_pool ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS talent_pool (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  phone                TEXT,
  nationality          TEXT,
  country              TEXT,
  years_experience     TEXT,
  qualification        TEXT,
  departments_interest TEXT[] DEFAULT '{}',
  statement            TEXT,
  cv_path              TEXT,
  source               TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  contacted_at         TIMESTAMPTZ,
  notes                TEXT,
  assigned_to          UUID REFERENCES admin_users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── email_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  to_email       TEXT NOT NULL,
  subject        TEXT NOT NULL,
  template       TEXT,
  status         TEXT NOT NULL DEFAULT 'sent',
  provider_id    TEXT,
  error          TEXT,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── branding_config ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branding_config (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branding_config_key ON branding_config(key);
INSERT INTO branding_config (key, value) VALUES
  ('org_name',         'Aerojet Aviation'),
  ('careers_url',      'careers.aerojet-aviation.com'),
  ('email_from',       'careers@aerojet-aviation.com'),
  ('logo_colour_path', 'images/aalogo-TUj_x_h8.png'),
  ('logo_white_path',  'images/aalogowhite-BCKBvd3h.png')
ON CONFLICT (key) DO NOTHING;

-- ── staff_profiles (migration 002 + 006) ──────────────────────
CREATE TABLE IF NOT EXISTS staff_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id        UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  admin_user_id       UUID REFERENCES admin_users(id),
  application_id      UUID REFERENCES applications(id),
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  avatar_url          TEXT,
  phone               TEXT,
  nationality         TEXT,
  date_of_birth       DATE,
  bio                 TEXT,
  employee_id         TEXT UNIQUE,
  job_title           TEXT NOT NULL,
  department          TEXT NOT NULL,
  reporting_manager_id UUID REFERENCES staff_profiles(id),
  employment_status   TEXT NOT NULL DEFAULT 'active',
  employment_type     employment_type NOT NULL DEFAULT 'full_time',
  joined_at           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── document_folders (migration 002) ──────────────────────────
CREATE TABLE IF NOT EXISTS document_folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO document_folders (name, description, icon) VALUES
  ('Personal', 'ID scans, Passports, and personal IDs', 'user'),
  ('Qualifications', 'Certificates, Licences, and EASA ratings', 'award'),
  ('Contract & Legal', 'Signed employment contracts and NDAs', 'file-text'),
  ('Medical', 'Health clearances and medical reports', 'heart-pulse'),
  ('Miscellaneous', 'Other employee documents', 'folder')
ON CONFLICT DO NOTHING;

-- ── staff_documents (migration 002) ───────────────────────────
CREATE TABLE IF NOT EXISTS staff_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id        UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  folder_id       UUID NOT NULL REFERENCES document_folders(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       TEXT,
  file_size       INTEGER,
  uploaded_by     UUID REFERENCES auth_users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── system_settings (migration 006) ───────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT,
  updated_by    UUID REFERENCES auth_users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('company_name', 'Aerojet Aviation Group'),
  ('portal_status', 'Operational'),
  ('base_location', 'Accra Base, GH'),
  ('enterprise_logo_url', '/images/aalogowhite-BCKBvd3h.png')
ON CONFLICT (setting_key) DO NOTHING;

-- ── departments & budgets (migration 006) ─────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  code            TEXT UNIQUE,
  manager_id      UUID REFERENCES admin_users(id),
  current_budget  NUMERIC(14,2),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_code ON departments(code);

CREATE TABLE IF NOT EXISTS department_budget_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  amount        NUMERIC(14,2),
  prev_amount   NUMERIC(14,2),
  change_reason TEXT,
  created_by    UUID REFERENCES auth_users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed departments matching the seeded job postings
INSERT INTO departments (name, code, current_budget) VALUES
  ('Engineering',   'ENG',  0),
  ('Quality',       'QUAL', 0),
  ('Operations',    'OPS',  0),
  ('IT',            'IT',   0),
  ('HR',            'HR',   0),
  ('Sales',         'SAL',  0),
  ('Logistics',     'LOG',  0)
ON CONFLICT (code) DO NOTHING;

-- ── dashboard_snapshots (migration 006) ───────────────────────
CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name   TEXT NOT NULL,
  metric_value  NUMERIC NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (metric_name, snapshot_date)
);

-- ── metadata lookup tables (migration 006) ────────────────────
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_categories_value ON job_categories(value);
INSERT INTO job_categories (value, label) VALUES
  ('experienced_professional', 'Experienced Professional'),
  ('graduate_program', 'Graduate Program'),
  ('skilled_training', 'Skilled Training'),
  ('general_application', 'General Application')
ON CONFLICT (value) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employment_types_value ON employment_types(value);
INSERT INTO employment_types (value, label) VALUES
  ('full_time', 'Full Time'),
  ('part_time', 'Part Time'),
  ('contract', 'Contract'),
  ('trainee', 'Trainee'),
  ('internship', 'Internship')
ON CONFLICT (value) DO NOTHING;

-- ── storage_objects (replaces Supabase Storage buckets) ───────
CREATE TABLE IF NOT EXISTS storage_objects (
  bucket       TEXT NOT NULL,
  path         TEXT NOT NULL,
  content      BYTEA NOT NULL,
  content_type TEXT,
  size         INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bucket, path)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_apps_status    ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_job       ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_email     ON applications(email);
CREATE INDEX IF NOT EXISTS idx_apps_submitted ON applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_hr        ON applications(hr_transferred, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_slug      ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_pipeline_app   ON pipeline_events(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_app         ON hr_transfers(application_id);
CREATE INDEX IF NOT EXISTS idx_docs_app       ON application_documents(application_id);

-- ── auto updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER t_apps_upd   BEFORE UPDATE ON applications              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_jobs_upd   BEFORE UPDATE ON jobs                      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_quals_upd  BEFORE UPDATE ON application_qualifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_exp_upd    BEFORE UPDATE ON application_experience     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_comp_upd   BEFORE UPDATE ON application_compensation   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_admins_upd BEFORE UPDATE ON admin_users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_authusers_upd BEFORE UPDATE ON auth_users             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_staff_upd  BEFORE UPDATE ON staff_profiles            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER t_staffdocs_upd BEFORE UPDATE ON staff_documents        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── auto ref_code for applications ───────────────────────────
CREATE OR REPLACE FUNCTION gen_app_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ref_code := 'AJT-APP-' || TO_CHAR(NOW(),'YYMMDD') || '-'
                  || LPAD(FLOOR(RANDOM()*9000+1000)::TEXT, 4, '0');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER t_app_ref BEFORE INSERT ON applications
    FOR EACH ROW WHEN (NEW.ref_code IS NULL OR NEW.ref_code = '')
    EXECUTE FUNCTION gen_app_ref();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── auto ref_code for jobs ────────────────────────────────────
CREATE OR REPLACE FUNCTION gen_job_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ref_code := 'AJT-' || UPPER(LEFT(REPLACE(NEW.department,' ',''),3))
                  || '-' || LPAD(FLOOR(RANDOM()*900+100)::TEXT, 3, '0');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER t_job_ref BEFORE INSERT ON jobs
    FOR EACH ROW WHEN (NEW.ref_code IS NULL OR NEW.ref_code = '')
    EXECUTE FUNCTION gen_job_ref();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── audit log on status change ────────────────────────────────
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO pipeline_events(application_id, event_type, from_status, to_status, note)
    VALUES (NEW.id, 'status_change', OLD.status::TEXT, NEW.status::TEXT,
            'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER t_status_log AFTER UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION log_status_change();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Seed: upsert job postings (update existing, insert new) ──────────
-- Uses temp table + UPDATE/INSERT to avoid requiring ON CONFLICT
-- (which needs a unique constraint that may not exist on legacy data).
-- 5 core positions seeded as 'open' (publicly visible).
-- All others are 'draft' (hidden from candidates).
-- Existing jobs are updated by slug (preserving their IDs and ref_codes).

CREATE TEMP TABLE seed_jobs AS
SELECT * FROM (VALUES
  ('Licensed Aircraft Engineers',        'licensed-aircraft-engineers',     'Engineering', 'experienced_professional', 'full_time', 'open',  10, 'EASA/GCAA licensed engineers across Category A, B1, B2 and C for our Accra MRO facility.',        ARRAY['EASA Part-66','B1','B2','Category C','Boeing 737','Airbus A320','AOG Support'], '2025-12-31'::date),
  ('Aircraft Mechanics (AME)',            'aircraft-mechanics',              'Engineering', 'experienced_professional', 'full_time', 'open',  15, 'Experienced aircraft maintenance engineers for line and base maintenance operations.',            ARRAY['Line Maintenance','A-Checks','Defect Rectification'],                           '2025-12-31'),
  ('Avionics Technicians',                'avionics-technicians',            'Engineering', 'experienced_professional', 'full_time', 'open',   6, 'EASA B2 licensed avionics and electrical systems engineers.',                                     ARRAY['EASA B2','Avionics','IFE','Navigation Systems'],                                '2025-12-31'),
  ('Quality Compliance Officer/Supervisor','quality-compliance-supervisor',  'Quality',     'experienced_professional', 'full_time', 'open',   3, 'QA engineers to develop and maintain our EASA Part-145 quality management system.',              ARRAY['EASA Part-145','QA','Compliance','Auditing'],                                   '2025-12-31'),
  ('Quality Manager',                     'quality-manager',                 'Quality',     'experienced_professional', 'full_time', 'open',   1, 'Head of Quality to lead EASA Part-145 compliance, audits, and the QMS team.',                    ARRAY['EASA Part-145','Quality Management','Auditing','Compliance'],                    '2025-12-31'),
  ('Engine Technicians',                  'engine-technicians',              'Engineering', 'experienced_professional', 'full_time', 'draft',  8, 'Powerplant technicians with CFM56, CFM LEAP or GE90 experience.',                                ARRAY['CFM56','CFM LEAP','GE90','Powerplant'],                                         NULL),
  ('Structures, Skins & Composites',      'composites-technicians',          'Engineering', 'experienced_professional', 'full_time', 'draft',  4, 'Structural repair and composites technicians with NDT experience.',                               ARRAY['NDT','Composite Repair','Structural Repair'],                                   NULL),
  ('Ground Handling & Marshalling',       'ground-handling-operatives',      'Operations',  'experienced_professional', 'full_time', 'draft', 10, 'Ramp operatives for aircraft ground handling, marshalling and airside operations.',              ARRAY['Ramp Operations','Aircraft Marshalling','Ground Safety','IATA DG'],             NULL),
  ('MRO Operations Manager',              'mro-operations-manager',          'Operations',  'experienced_professional', 'full_time', 'draft',  1, 'Senior operations manager to lead MRO planning, production control and capacity management.',   ARRAY['MRO Operations','CAMO','Production Planning'],                                  NULL),
  ('IT Systems & Aviation Software Eng.', 'it-systems-engineer',             'IT',          'experienced_professional', 'full_time', 'draft',  2, 'Engineer to deploy and administer AMOS/TRAX and core IT infrastructure.',                      ARRAY['AMOS','TRAX','Aviation IT','ERP'],                                              NULL),
  ('HR Business Partner',                 'hr-business-partner',             'HR',          'experienced_professional', 'full_time', 'draft',  1, 'Senior HRBP to build HR capability and support the MRO facility launch team.',                  ARRAY['HR Strategy','Talent Acquisition','Employment Law'],                            NULL),
  ('Commercial & Sales Manager',          'commercial-sales-manager',        'Sales',       'experienced_professional', 'full_time', 'draft',  1, 'Commercial manager to develop airline contracts and business development for MRO services.',    ARRAY['MRO Commercial','Airline Contracts','Business Development'],                    NULL),
  ('Parts & Logistics Coordinator',       'parts-logistics-coordinator',     'Logistics',   'experienced_professional', 'full_time', 'draft',  3, 'Aviation supply chain and parts coordinator for AOG and scheduled maintenance.',               ARRAY['AOG Parts','Supply Chain','Customs','Air Freight'],                             NULL),
  ('Graduate Engineer Program',           'graduate-engineer-program',       'Engineering', 'graduate_program',         'full_time', 'draft',  5, 'Structured 24-month graduate programme with pathway to EASA/GCAA AME Licence.',               ARRAY['Graduate','AME Pathway','Mentorship','Rotational'],                             NULL),
  ('Graduate Operations Analyst',         'graduate-operations-analyst',     'Operations',  'graduate_program',         'full_time', 'draft',  3, 'Graduate placement in MRO operations, production control and regulatory compliance.',          ARRAY['Graduate','Operations','MRO Planning'],                                         NULL),
  ('Trainee Aircraft Mechanics',          'trainee-aircraft-mechanics',      'Engineering', 'skilled_training',         'trainee',   'draft', 10, 'Apprentice aircraft mechanics programme with Category A licence pathway.',                      ARRAY['Trainee','Cat A Pathway','Line Maintenance','Apprenticeship'],                  NULL),
  ('Ground Handling Trainees',            'trainee-ground-handling',         'Operations',  'skilled_training',         'trainee',   'draft', 10, 'Entry-level ramp operative training with IATA Dangerous Goods certification included.',         ARRAY['Trainee','IATA DG','Ramp Operations','Entry Level'],                            NULL)
) AS v(title, slug, department, category, employment_type, status, target_count, summary, tags, closes_at);

-- Update existing seed jobs (preserves IDs and ref_codes)
UPDATE jobs SET
  title = s.title,
  department = s.department,
  category = s.category::job_category,
  employment_type = s.employment_type::employment_type,
  status = s.status::job_status,
  target_count = s.target_count,
  summary = s.summary,
  tags = s.tags,
  closes_at = s.closes_at,
  updated_at = NOW()
FROM seed_jobs s
WHERE jobs.slug = s.slug;

-- Insert new seed jobs (those that don't exist yet)
INSERT INTO jobs (title, slug, department, category, employment_type, status, target_count, summary, tags, closes_at)
SELECT s.title, s.slug, s.department, s.category::job_category, s.employment_type::employment_type, s.status::job_status, s.target_count, s.summary, s.tags, s.closes_at
FROM seed_jobs s
WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE slug = s.slug);

DROP TABLE seed_jobs;

-- ── Indexes (performance) ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_department    ON jobs(department);
CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_slug          ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_admin_users_role   ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_auth   ON admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_type  ON pipeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_admin ON pipeline_events(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_events_app   ON pipeline_events(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_users_email   ON auth_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_talent_pool_email  ON talent_pool(email);
CREATE INDEX IF NOT EXISTS idx_apps_status        ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_job           ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_email         ON applications(email);
CREATE INDEX IF NOT EXISTS idx_docs_app           ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at   ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_created_at   ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_deleted_at   ON applications(deleted_at) WHERE deleted_at IS NULL;
