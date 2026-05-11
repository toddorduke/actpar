-- ============================================================
-- Numeric / Progress Goals support
-- Safe to re-run (IF NOT EXISTS + IF COLUMN NOT EXISTS)
-- ============================================================

-- 1. Extend the goals table
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS goal_type    text    NOT NULL DEFAULT 'habit',  -- 'habit' | 'numeric'
  ADD COLUMN IF NOT EXISTS target_value numeric,                            -- e.g. 20
  ADD COLUMN IF NOT EXISTS target_unit  text,                               -- e.g. 'miles', 'lbs', '$'
  ADD COLUMN IF NOT EXISTS target_period text;                              -- 'weekly' | 'monthly' | 'total'

-- 2. Progress log table
CREATE TABLE IF NOT EXISTS goal_progress (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id    uuid        REFERENCES goals(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  value      numeric     NOT NULL,
  note       text,
  logged_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goal_progress_goal_idx      ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS goal_progress_user_idx      ON goal_progress(user_id);
CREATE INDEX IF NOT EXISTS goal_progress_logged_at_idx ON goal_progress(logged_at);

ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_insert" ON goal_progress;
DROP POLICY IF EXISTS "progress_select" ON goal_progress;

-- Owners can insert their own progress
CREATE POLICY "progress_insert" ON goal_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- All authenticated users can read (enables pact leaderboard)
CREATE POLICY "progress_select" ON goal_progress FOR SELECT
  USING (auth.role() = 'authenticated');
