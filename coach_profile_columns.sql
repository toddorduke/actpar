-- Coach profile columns — add to profiles table
-- Run in Supabase SQL editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_specialty      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_tagline        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_rate           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_rate_num       integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_experience     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_clients_helped text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_session_types  text[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_tags           text[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_bio            text[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_verified       boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_credentials    jsonb   DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_links          jsonb   DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_philosophy     jsonb   DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_values         text[]  DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_testimonials   jsonb   DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_sessions       jsonb   DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_programs       jsonb   DEFAULT '[]';

-- Unique alter ego names (nulls are allowed, only filled values must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_alter_ego_name_unique
  ON profiles (lower(alter_ego_name))
  WHERE alter_ego_name IS NOT NULL AND alter_ego_name <> '';
