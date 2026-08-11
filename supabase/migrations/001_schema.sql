-- ============================================================
-- AEROJET AVIATION — ATS + HR DATABASE SCHEMA
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────
CREATE TYPE application_status AS ENUM (
  'new','under_review','shortlisted','interview',
  'offer','hired','rejected','transferred_to_hr','withdrawn'
);
CREATE TYPE job_status AS ENUM ('draft','open','paused','closed','filled');
CREATE TYPE job_category AS ENUM ('experienced_professional','graduate_program','skilled_training','general_application');
CREATE TYPE employment_type AS ENUM ('full_time','part_time','contract','trainee','internship');
CREATE TYPE admin_role AS ENUM ('super_admin','admin','hr_manager','recruiter','read_only');
CREATE TYPE hr_platform AS ENUM ('bamboohr','workday','sap','zoho','csv','custom');
CREATE TYPE doc_type AS ENUM ('cv','licence_scan','passport_scan','other');

-- ── admin_users ───────────────────────────────────────────────
CREATE TABLE admin_users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  role         admin_role NOT NULL DEFAULT 'recruiter',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── jobs ─────────────────────────────────────────────────────
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_code        TEXT UNIQUE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  department      TEXT NOT NULL,
  category        job_category NOT NULL DEFAULT 'experienced_professional',
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  location        TEXT NOT NULL DEFAULT 'Accra, Ghana (AIA)',
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
CREATE TABLE applications (
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
  recruiter_notes      TEXT,
  rejection_reason     TEXT,
  hr_transferred       BOOLEAN NOT NULL DEFAULT FALSE,
  hr_transferred_at    TIMESTAMPTZ,
  hr_employee_id       TEXT,
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at          TIMESTAMPTZ,
  shortlisted_at       TIMESTAMPTZ,
  hired_at             TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── application_qualifications ────────────────────────────────
CREATE TABLE application_qualifications (
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
CREATE TABLE application_experience (
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
CREATE TABLE application_compensation (
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
CREATE TABLE application_documents (
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

-- ── pipeline_events ───────────────────────────────────────────
CREATE TABLE pipeline_events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  admin_user_id  UUID REFERENCES admin_users(id),
  event_type     TEXT NOT NULL,
  from_status    TEXT,
  to_status      TEXT,
  note           TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── hr_transfers ──────────────────────────────────────────────
CREATE TABLE hr_transfers (
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
CREATE TABLE talent_pool (
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
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── email_logs ────────────────────────────────────────────────
CREATE TABLE email_logs (
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
CREATE TABLE branding_config (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO branding_config (key, value) VALUES
  ('org_name',         'Aerojet Aviation'),
  ('careers_url',      'careers.aerojet-aviation.com'),
  ('email_from',       'careers@aerojet-aviation.com'),
  ('logo_colour_path', 'images/aalogo-TUj_x_h8.png'),
  ('logo_white_path',  'images/aalogowhite-BCKBvd3h.png');

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_apps_status    ON applications(status);
CREATE INDEX idx_apps_job       ON applications(job_id);
CREATE INDEX idx_apps_email     ON applications(email);
CREATE INDEX idx_apps_submitted ON applications(submitted_at DESC);
CREATE INDEX idx_apps_hr        ON applications(hr_transferred, status);
CREATE INDEX idx_apps_search    ON applications
  USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));
CREATE INDEX idx_jobs_status    ON jobs(status);
CREATE INDEX idx_jobs_slug      ON jobs(slug);
CREATE INDEX idx_pipeline_app   ON pipeline_events(application_id, created_at DESC);
CREATE INDEX idx_hr_app         ON hr_transfers(application_id);
CREATE INDEX idx_docs_app       ON application_documents(application_id);

-- ── auto updated_at ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER t_apps_upd      BEFORE UPDATE ON applications             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_jobs_upd      BEFORE UPDATE ON jobs                     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_quals_upd     BEFORE UPDATE ON application_qualifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_exp_upd       BEFORE UPDATE ON application_experience    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_comp_upd      BEFORE UPDATE ON application_compensation  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER t_admins_upd    BEFORE UPDATE ON admin_users               FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── auto ref_code for applications ───────────────────────────
CREATE OR REPLACE FUNCTION gen_app_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ref_code := 'AJT-APP-' || TO_CHAR(NOW(),'YYMMDD') || '-'
                  || LPAD(FLOOR(RANDOM()*9000+1000)::TEXT, 4, '0');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER t_app_ref BEFORE INSERT ON applications
  FOR EACH ROW WHEN (NEW.ref_code IS NULL OR NEW.ref_code = '')
  EXECUTE FUNCTION gen_app_ref();

-- ── auto ref_code for jobs ────────────────────────────────────
CREATE OR REPLACE FUNCTION gen_job_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ref_code := 'AJT-' || UPPER(LEFT(REPLACE(NEW.department,' ',''),3))
                  || '-' || LPAD(FLOOR(RANDOM()*900+100)::TEXT, 3, '0');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER t_job_ref BEFORE INSERT ON jobs
  FOR EACH ROW WHEN (NEW.ref_code IS NULL OR NEW.ref_code = '')
  EXECUTE FUNCTION gen_job_ref();

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

CREATE TRIGGER t_status_log AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE applications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_experience    ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_compensation  ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_transfers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_pool               ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_config           ENABLE ROW LEVEL SECURITY;

-- Public can read open jobs
CREATE POLICY "public_read_open_jobs" ON jobs FOR SELECT USING (status = 'open');

-- Public can submit applications and register
CREATE POLICY "public_insert_applications"  ON applications              FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_quals"         ON application_qualifications FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_exp"           ON application_experience     FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_comp"          ON application_compensation   FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_talent"        ON talent_pool                FOR INSERT WITH CHECK (true);

-- Admin full access (service role bypasses RLS anyway, these cover direct Supabase client use)
CREATE POLICY "admin_all_applications" ON applications FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

CREATE POLICY "admin_all_jobs" ON jobs FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

CREATE POLICY "admin_all_pipeline" ON pipeline_events FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

CREATE POLICY "admin_all_hr" ON hr_transfers FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

CREATE POLICY "admin_all_talent" ON talent_pool FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

CREATE POLICY "admin_all_docs" ON application_documents FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

CREATE POLICY "admin_all_branding" ON branding_config FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid() AND is_active));

-- ── Storage buckets (run after creating buckets in Supabase UI) ──────
-- In Supabase Dashboard > Storage, create:
--   1. "application-documents"  (private)
--   2. "branding-assets"        (public)
-- Then add this policy for application-documents:
-- CREATE POLICY "service_role_access" ON storage.objects FOR ALL
--   USING (auth.role() = 'service_role');

-- ── Seed: initial job postings ────────────────────────────────
-- Only 5 core positions are seeded as 'open' (publicly visible).
-- All other seeded positions are 'draft' (hidden from candidates).
-- Admins can later publish or unpublish from /admin/jobs.
INSERT INTO jobs (title, slug, department, category, employment_type, status, target_count, summary, tags, closes_at) VALUES
  ('Licensed Aircraft Engineers',        'licensed-aircraft-engineers',     'Engineering', 'experienced_professional', 'full_time', 'open',  10, 'EASA/GCAA licensed engineers across Category A, B1, B2 and C for our Accra MRO facility.',        ARRAY['EASA Part-66','B1','B2','Category C','Boeing 737','Airbus A320','AOG Support'], '2025-12-31'),
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
  ('Ground Handling Trainees',            'trainee-ground-handling',         'Operations',  'skilled_training',         'trainee',   'draft', 10, 'Entry-level ramp operative training with IATA Dangerous Goods certification included.',         ARRAY['Trainee','IATA DG','Ramp Operations','Entry Level'],                            NULL);

-- ── Add first admin user (run AFTER creating user in Supabase Auth) ────
-- Replace the email below with your actual admin email address.
-- INSERT INTO admin_users (auth_user_id, email, full_name, role)
-- SELECT id, email, 'Admin User', 'super_admin'
-- FROM auth.users WHERE email = 'admin@aerojet-aviation.com';
