-- Add separate bio column to profiles (About Me — longer description)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
