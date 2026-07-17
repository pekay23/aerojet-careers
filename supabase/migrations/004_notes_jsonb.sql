-- ============================================================
-- 004_NOTES_JSONB.SQL
-- Safely adds recruiter_notes column (if missing) and
-- converts it from TEXT to JSONB.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Step 1: Add the column if it was never created
-- (001_schema.sql may have failed mid-run due to pre-existing enums)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

-- Step 2: Wrap any pre-existing plain-text notes into a valid JSON array
-- so the USING cast on Step 3 doesn't fail.
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

-- Step 3: Convert the column to JSONB
ALTER TABLE applications
  ALTER COLUMN recruiter_notes TYPE JSONB USING recruiter_notes::jsonb;
