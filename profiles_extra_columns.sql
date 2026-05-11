-- Missing profile columns used by the app
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affirmation_start_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reflection_questions   text[] DEFAULT '{}';
