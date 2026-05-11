-- Push subscriptions for web push notifications
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_sub_user_idx ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_sub_select" ON push_subscriptions;
DROP POLICY IF EXISTS "push_sub_insert" ON push_subscriptions;
DROP POLICY IF EXISTS "push_sub_delete" ON push_subscriptions;

CREATE POLICY "push_sub_select" ON push_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "push_sub_insert" ON push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_sub_delete" ON push_subscriptions FOR DELETE USING (user_id = auth.uid());
