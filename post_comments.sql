-- ============================================================
-- Post comments — shared table for tribe_posts and pact_posts
-- Safe to re-run (IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid NOT NULL,
  post_type  text NOT NULL DEFAULT 'tribe',  -- 'tribe' | 'pact'
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_post_idx ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS comments_user_idx ON post_comments(user_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON post_comments;
DROP POLICY IF EXISTS "comments_insert" ON post_comments;
DROP POLICY IF EXISTS "comments_delete" ON post_comments;

-- Anyone authenticated can read comments
CREATE POLICY "comments_select" ON post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert their own comments
CREATE POLICY "comments_insert" ON post_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Authors can delete their own comments
CREATE POLICY "comments_delete" ON post_comments FOR DELETE
  USING (user_id = auth.uid());
