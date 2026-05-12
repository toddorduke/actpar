-- Track how often a user has changed their alter ego name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alter_ego_change_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alter_ego_last_changed timestamptz;
