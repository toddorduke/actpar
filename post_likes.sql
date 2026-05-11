-- ============================================================
-- Post likes — one row per user per post, supports unlike
-- Safe to re-run (IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS post_likes (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id   uuid NOT NULL,
  post_type text NOT NULL DEFAULT 'tribe',  -- 'tribe' | 'pact'
  user_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS likes_post_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS likes_user_idx ON post_likes(user_id);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select" ON post_likes;
DROP POLICY IF EXISTS "likes_insert" ON post_likes;
DROP POLICY IF EXISTS "likes_delete" ON post_likes;

CREATE POLICY "likes_select" ON post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "likes_insert" ON post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete" ON post_likes FOR DELETE
  USING (user_id = auth.uid());


-- ── Helper RPCs to increment/decrement likes count ────────────────────────────

CREATE OR REPLACE FUNCTION increment_post_likes(p_post_id uuid, p_post_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_post_type = 'tribe' THEN
    UPDATE tribe_posts SET likes = COALESCE(likes, 0) + 1 WHERE id = p_post_id;
  ELSIF p_post_type = 'pact' THEN
    UPDATE pact_posts SET likes = COALESCE(likes, 0) + 1 WHERE id = p_post_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(p_post_id uuid, p_post_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_post_type = 'tribe' THEN
    UPDATE tribe_posts SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = p_post_id;
  ELSIF p_post_type = 'pact' THEN
    UPDATE pact_posts SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = p_post_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_post_likes(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes(uuid, text) TO authenticated;
