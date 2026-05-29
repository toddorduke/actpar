-- Add deadline columns to partnerships for scheduled check-in reminders
ALTER TABLE partnerships
  ADD COLUMN IF NOT EXISTS deadline_utc_hour integer,
  ADD COLUMN IF NOT EXISTS deadline_display   text;
