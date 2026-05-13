-- Check-in log: records every goal check-in with timestamp and type.
-- log_type: 'manual' = user tapped Check In
--           'backdated' = user logged a past day retroactively
--           'auto' = user tapped the daily push notification (auto-log setting)

CREATE TABLE IF NOT EXISTS checkin_logs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id        uuid REFERENCES goals(id)    ON DELETE CASCADE NOT NULL,
  checked_in_at  timestamptz NOT NULL DEFAULT now(),
  log_type       text NOT NULL DEFAULT 'manual',
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkin_logs_user_idx ON checkin_logs(user_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS checkin_logs_goal_idx ON checkin_logs(goal_id, checked_in_at DESC);

ALTER TABLE checkin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_checkin_logs" ON checkin_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
