-- ============================================================
-- Missing tables: journal_entries, media, pacts + pact sub-tables
-- Safe to re-run (IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ============================================================


-- ── Journal Entries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject    text NOT NULL,
  body       text NOT NULL,
  is_public  boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_user_idx ON journal_entries(user_id, created_at DESC);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_select" ON journal_entries;
DROP POLICY IF EXISTS "journal_insert" ON journal_entries;
DROP POLICY IF EXISTS "journal_update" ON journal_entries;
DROP POLICY IF EXISTS "journal_delete" ON journal_entries;

CREATE POLICY "journal_select" ON journal_entries FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "journal_insert" ON journal_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "journal_update" ON journal_entries FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "journal_delete" ON journal_entries FOR DELETE
  USING (user_id = auth.uid());


-- ── Media ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_url   text NOT NULL,
  file_type  text NOT NULL DEFAULT 'photo',  -- 'photo' | 'video'
  caption    text,
  visibility text NOT NULL DEFAULT 'everyone',
  share_to   text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_user_idx ON media(user_id, created_at DESC);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select" ON media;
DROP POLICY IF EXISTS "media_insert" ON media;
DROP POLICY IF EXISTS "media_delete" ON media;

CREATE POLICY "media_select" ON media FOR SELECT
  USING (user_id = auth.uid() OR visibility = 'everyone');
CREATE POLICY "media_insert" ON media FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "media_delete" ON media FOR DELETE
  USING (user_id = auth.uid());


-- ── Pacts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pacts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  description text,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_open     boolean DEFAULT true,
  invite_code text UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE pacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pacts_select" ON pacts;
DROP POLICY IF EXISTS "pacts_insert" ON pacts;
DROP POLICY IF EXISTS "pacts_update" ON pacts;
DROP POLICY IF EXISTS "pacts_delete" ON pacts;

CREATE POLICY "pacts_select" ON pacts FOR SELECT USING (true);
CREATE POLICY "pacts_insert" ON pacts FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "pacts_update" ON pacts FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "pacts_delete" ON pacts FOR DELETE
  USING (created_by = auth.uid());


-- ── Pact Members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pact_members (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pact_id   uuid REFERENCES pacts(id) ON DELETE CASCADE NOT NULL,
  user_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role      text NOT NULL DEFAULT 'member',  -- 'founder' | 'co-lead' | 'member'
  joined_at timestamptz DEFAULT now(),
  UNIQUE(pact_id, user_id)
);

CREATE INDEX IF NOT EXISTS pact_members_pact_idx ON pact_members(pact_id);
CREATE INDEX IF NOT EXISTS pact_members_user_idx ON pact_members(user_id);

ALTER TABLE pact_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pact_members_select" ON pact_members;
DROP POLICY IF EXISTS "pact_members_insert" ON pact_members;
DROP POLICY IF EXISTS "pact_members_update" ON pact_members;
DROP POLICY IF EXISTS "pact_members_delete" ON pact_members;

CREATE POLICY "pact_members_select" ON pact_members FOR SELECT USING (true);
CREATE POLICY "pact_members_insert" ON pact_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "pact_members_update" ON pact_members FOR UPDATE
  USING (
    -- founder/co-lead of the pact can update member roles
    EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_members.pact_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('founder', 'co-lead')
    )
  );
CREATE POLICY "pact_members_delete" ON pact_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_members.pact_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'founder'
    )
  );


-- ── Pact Rules ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pact_rules (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pact_id   uuid REFERENCES pacts(id) ON DELETE CASCADE NOT NULL,
  rule_text text NOT NULL,
  position  int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pact_rules_pact_idx ON pact_rules(pact_id, position);

ALTER TABLE pact_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pact_rules_select" ON pact_rules;
DROP POLICY IF EXISTS "pact_rules_insert" ON pact_rules;
DROP POLICY IF EXISTS "pact_rules_update" ON pact_rules;
DROP POLICY IF EXISTS "pact_rules_delete" ON pact_rules;

CREATE POLICY "pact_rules_select" ON pact_rules FOR SELECT USING (true);
CREATE POLICY "pact_rules_insert" ON pact_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_rules.pact_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('founder', 'co-lead')
    )
  );
CREATE POLICY "pact_rules_update" ON pact_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_rules.pact_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('founder', 'co-lead')
    )
  );
CREATE POLICY "pact_rules_delete" ON pact_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_rules.pact_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('founder', 'co-lead')
    )
  );


-- ── Pact Posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pact_posts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pact_id    uuid REFERENCES pacts(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  post_type  text NOT NULL DEFAULT 'update',  -- 'update' | 'win' | 'challenge' | 'event'
  milestone  text,
  likes      int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pact_posts_pact_idx ON pact_posts(pact_id, created_at DESC);

ALTER TABLE pact_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pact_posts_select" ON pact_posts;
DROP POLICY IF EXISTS "pact_posts_insert" ON pact_posts;
DROP POLICY IF EXISTS "pact_posts_update" ON pact_posts;
DROP POLICY IF EXISTS "pact_posts_delete" ON pact_posts;

CREATE POLICY "pact_posts_select" ON pact_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_posts.pact_id AND pm.user_id = auth.uid()
    )
  );
CREATE POLICY "pact_posts_insert" ON pact_posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_posts.pact_id AND pm.user_id = auth.uid()
    )
  );
CREATE POLICY "pact_posts_update" ON pact_posts FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "pact_posts_delete" ON pact_posts FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pact_members pm
      WHERE pm.pact_id = pact_posts.pact_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'founder'
    )
  );
