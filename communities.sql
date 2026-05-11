-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  description text,
  avatar_url  text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- Memberships
CREATE TABLE IF NOT EXISTS community_memberships (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    timestamptz DEFAULT now(),
  UNIQUE (community_id, user_id)
);

-- Add community_id to tribe_posts (null = global/general feed)
ALTER TABLE tribe_posts ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES communities(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view communities"
  ON communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can update their community"
  ON communities FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Anyone can view memberships"
  ON community_memberships FOR SELECT USING (true);

CREATE POLICY "Users can join communities"
  ON community_memberships FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities"
  ON community_memberships FOR DELETE USING (user_id = auth.uid());
