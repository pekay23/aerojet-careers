-- Add soft delete support to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update RLS to ensure soft-deleted records are handled securely (optional if using filter in API)
-- Standard practice is to filter in the application layer for flexibility