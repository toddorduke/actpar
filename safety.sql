-- ============================================================
-- SAFETY.SQL — Run this in Supabase SQL editor
-- Creates: reports, blocked_users tables + RLS policies
-- ============================================================

-- 1. Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid,          -- generic — could be tribe_post, pact_post, etc.
  post_type text,        -- 'tribe' | 'pact' | 'profile'
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can file a report
CREATE POLICY "users can create reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Only the reporter can see their own reports (no public listing)
CREATE POLICY "users can view own reports"
  ON reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- 2. Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can manage their own blocks
CREATE POLICY "users can view own blocks"
  ON blocked_users FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY "users can block others"
  ON blocked_users FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "users can unblock"
  ON blocked_users FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

-- 3. RLS on connections — users should only see their own connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see own connections"
  ON connections FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "users can create connection requests"
  ON connections FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "receiver can update status"
  ON connections FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());

CREATE POLICY "users can delete own connections"
  ON connections FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

-- 4. RLS on tribe_posts — authenticated users can read, owners can modify
ALTER TABLE tribe_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read tribe posts"
  ON tribe_posts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users can create own tribe posts"
  ON tribe_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own tribe posts"
  ON tribe_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users can delete own tribe posts"
  ON tribe_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. RLS on profiles — public read for social features, own write only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are publicly readable by authenticated users"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6. RLS on goals — public read, own write
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals are readable by authenticated users"
  ON goals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users can manage own goals"
  ON goals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own goals"
  ON goals FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users can delete own goals"
  ON goals FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for reports (optional, for admin dashboard later)
-- ALTER PUBLICATION supabase_realtime ADD TABLE reports;
