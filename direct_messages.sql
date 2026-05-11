-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content     text NOT NULL CHECK (char_length(content) <= 2000),
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_sender_idx   ON direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_receiver_idx ON direct_messages(receiver_id, created_at DESC);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_select" ON direct_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "dm_insert" ON direct_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "dm_update_read" ON direct_messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
