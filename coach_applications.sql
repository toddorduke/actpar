-- ============================================================
-- Coach applications — stores "Become a Coach" submissions
-- Safe to re-run (IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS coach_applications (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  email           text NOT NULL,
  location        text,
  specialty       text NOT NULL,
  experience      text NOT NULL,  -- e.g. '3-5 years'
  certifications  text,
  session_types   text[] NOT NULL DEFAULT '{}',
  rate_range      text,
  bio             text NOT NULL,
  why_coach       text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_apps_user_idx ON coach_applications(user_id);
CREATE INDEX IF NOT EXISTS coach_apps_status_idx ON coach_applications(status);

ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_app_insert" ON coach_applications;
DROP POLICY IF EXISTS "coach_app_select" ON coach_applications;

-- Users can submit an application and view their own
CREATE POLICY "coach_app_insert" ON coach_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "coach_app_select" ON coach_applications FOR SELECT
  USING (user_id = auth.uid());
