-- ============================================================
-- Notifications table
-- Safe to re-run (IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  -- 'connection_request' | 'connection_accepted' | 'pact_joined' | 'pact_post' | 'post_like'
  ref_id     uuid,
  body       text NOT NULL,
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notif_user_idx ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;
DROP POLICY IF EXISTS "notif_delete" ON notifications;

-- Users can only read their own notifications
CREATE POLICY "notif_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Any authenticated user can insert (to notify others)
CREATE POLICY "notif_insert" ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can mark their own as read
CREATE POLICY "notif_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own
CREATE POLICY "notif_delete" ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for instant delivery
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
