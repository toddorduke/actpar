-- Add cover photo and invite code to communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS join_code text UNIQUE DEFAULT substring(md5(random()::text), 1, 8);
ALTER TABLE communities ADD COLUMN IF NOT EXISTS pinned_post_id uuid REFERENCES tribe_posts(id) ON DELETE SET NULL;

-- Community Events
CREATE TABLE IF NOT EXISTS community_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  location     text,
  event_date   timestamptz NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status   text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  UNIQUE (event_id, user_id)
);

-- Group Chat
CREATE TABLE IF NOT EXISTS community_messages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Community Challenges
CREATE TABLE IF NOT EXISTS community_challenges (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  target_value numeric NOT NULL,
  unit         text NOT NULL DEFAULT 'miles',
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Challenge Entries (individual contributions)
CREATE TABLE IF NOT EXISTS challenge_entries (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  value        numeric NOT NULL,
  note         text,
  logged_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE community_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries    ENABLE ROW LEVEL SECURITY;

-- Events
CREATE POLICY "Anyone can view events"       ON community_events FOR SELECT USING (true);
CREATE POLICY "Auth users can create events" ON community_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update events"    ON community_events FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Creator can delete events"    ON community_events FOR DELETE USING (created_by = auth.uid());

-- RSVPs
CREATE POLICY "Anyone can view rsvps"        ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can rsvp"               ON event_rsvps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update rsvp"        ON event_rsvps FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete rsvp"        ON event_rsvps FOR DELETE USING (user_id = auth.uid());

-- Messages
CREATE POLICY "Anyone can view messages"     ON community_messages FOR SELECT USING (true);
CREATE POLICY "Auth users can send messages" ON community_messages FOR INSERT WITH CHECK (user_id = auth.uid());

-- Challenges
CREATE POLICY "Anyone can view challenges"   ON community_challenges FOR SELECT USING (true);
CREATE POLICY "Auth users can create challenge" ON community_challenges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update challenge" ON community_challenges FOR UPDATE USING (created_by = auth.uid());

-- Challenge Entries
CREATE POLICY "Anyone can view entries"      ON challenge_entries FOR SELECT USING (true);
CREATE POLICY "Users can log entries"        ON challenge_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own entries" ON challenge_entries FOR DELETE USING (user_id = auth.uid());

-- Allow admins to update community (cover, pinned post, etc.)
CREATE POLICY "Admin can update community"
  ON communities FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM community_memberships
      WHERE community_id = communities.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Allow admins to remove members
CREATE POLICY "Admin can remove members"
  ON community_memberships FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM community_memberships AS cm
      WHERE cm.community_id = community_memberships.community_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );
