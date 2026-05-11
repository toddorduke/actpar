-- Add notification_prefs column to profiles
-- Safe to re-run
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{
    "daily_reminder": true,
    "sparks": true,
    "pact": true,
    "tribe": false
  }'::jsonb;
