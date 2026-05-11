-- Reflections and affirmations (safe to re-run)
-- Creates the table if new, or patches missing columns if it already existed

CREATE TABLE IF NOT EXISTS reflections (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  answer     text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add columns that may be missing from an older version of the table
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS type      text    NOT NULL DEFAULT 'reflection';
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS question  text;
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS reflections_user_idx ON reflections(user_id, created_at DESC);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reflections_select" ON reflections;
DROP POLICY IF EXISTS "reflections_insert" ON reflections;
DROP POLICY IF EXISTS "reflections_delete" ON reflections;

CREATE POLICY "reflections_select" ON reflections FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "reflections_insert" ON reflections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reflections_delete" ON reflections FOR DELETE
  USING (user_id = auth.uid());
