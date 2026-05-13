-- Add profile_setup_complete flag to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_setup_complete boolean DEFAULT false;
