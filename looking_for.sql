-- Add looking_for as a text array on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}';
