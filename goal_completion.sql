-- Add completed_at to goals so we can distinguish "completed" from "deleted"
-- Safe to re-run
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_at timestamptz;
