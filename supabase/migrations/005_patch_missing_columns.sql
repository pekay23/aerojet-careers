-- ============================================================
-- 005_PATCH_MISSING_COLUMNS.SQL
-- Idempotent: adds any columns from 001_schema.sql that may
-- have been skipped because CREATE TYPE failed on a re-run,
-- causing the rest of 001 to be rolled back.
--
-- Safe to run multiple times — all statements use IF NOT EXISTS.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── applications: columns from 001 that may be missing ───────

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS job_title             TEXT,
  ADD COLUMN IF NOT EXISTS priority              INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS source                TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to           UUID REFERENCES admin_users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason      TEXT,
  ADD COLUMN IF NOT EXISTS hr_transferred        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hr_transferred_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hr_employee_id        TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS reviewed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shortlisted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hired_at              TIMESTAMPTZ,
  -- from 003_soft_delete (belt-and-suspenders)
  ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ;

-- ── recruiter_notes: add as TEXT first, then convert to JSONB ─
-- (handled by 004_notes_jsonb.sql — repeated here as fallback)

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

-- Wrap any raw plain-text notes before the JSONB cast
UPDATE applications
SET recruiter_notes = json_build_array(
  json_build_object(
    'id',     'legacy-' || extract(epoch from created_at)::bigint,
    'text',   recruiter_notes,
    'author', 'Legacy Note',
    'date',   created_at
  )
)::text
WHERE recruiter_notes IS NOT NULL
  AND trim(recruiter_notes) != ''
  AND NOT (trim(recruiter_notes) LIKE '[%' OR trim(recruiter_notes) LIKE '{%');

-- Convert to JSONB (no-op if already JSONB)
DO $$
BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'recruiter_notes'
  ) = 'text' THEN
    ALTER TABLE applications
      ALTER COLUMN recruiter_notes TYPE JSONB USING recruiter_notes::jsonb;
  END IF;
END $$;

-- ── Ensure indexes exist (safe to re-run) ─────────────────────
CREATE INDEX IF NOT EXISTS idx_apps_status    ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_job       ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_email     ON applications(email);
CREATE INDEX IF NOT EXISTS idx_apps_submitted ON applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_hr        ON applications(hr_transferred, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_slug      ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_pipeline_app   ON pipeline_events(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_docs_app       ON application_documents(application_id);

-- ── Ensure admin_role enum has 'employee' value ───────────────
-- (added in 002_staff_system.sql — belt-and-suspenders)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'admin_role'::regtype
      AND enumlabel = 'employee'
  ) THEN
    ALTER TYPE admin_role ADD VALUE 'employee';
  END IF;
END $$;
