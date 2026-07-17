-- ============================================================
-- 007_RELAX_AUDIT_CONSTRAINTS.SQL
-- Allows logging of system-wide events (non-application specific)
-- ============================================================

-- 1. Make application_id nullable in pipeline_events
ALTER TABLE pipeline_events 
ALTER COLUMN application_id DROP NOT NULL;

-- 2. Add comment for documentation
COMMENT ON COLUMN pipeline_events.application_id IS 'Optional link to a candidate application. Can be NULL for system-wide activity logs.';
