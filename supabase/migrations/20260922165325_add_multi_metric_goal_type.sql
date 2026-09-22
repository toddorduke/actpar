-- New goal type for structured multi-component training (HYROX stations,
-- a lifting program's separate lifts, etc.) -- the existing 'numeric'
-- type is one number/one unit/one target, which can't represent "8
-- different station times under one goal" without either cramming
-- unrelated numbers into one field or burning 8 of the user's 2-4 active
-- goal slots on what's really one thing they're training for.
--
-- A 'multi' goal is a lightweight container (frequency/target_value/
-- target_unit/target_period all NULL, same as it has none of its own --
-- targets live per-metric instead). Its metrics are user-defined rows in
-- goal_metrics_v2 (name + how to measure it + optional target), each with
-- its own logged history in goal_metric_logs_v2.

ALTER TABLE public.goals_v2 DROP CONSTRAINT goals_v2_goal_type_check;
ALTER TABLE public.goals_v2 ADD CONSTRAINT goals_v2_goal_type_check
  CHECK (goal_type = ANY (ARRAY['habit'::text, 'numeric'::text, 'multi'::text]));

ALTER TABLE public.goals_v2 DROP CONSTRAINT goals_v2_type_fields_check;
ALTER TABLE public.goals_v2 ADD CONSTRAINT goals_v2_type_fields_check
  CHECK (
    ((goal_type = 'habit'::text) AND (frequency IS NOT NULL) AND (target_value IS NULL) AND (target_unit IS NULL) AND (target_period IS NULL))
    OR ((goal_type = 'numeric'::text) AND (target_value IS NOT NULL) AND (target_unit IS NOT NULL) AND (target_period IS NOT NULL))
    OR ((goal_type = 'multi'::text) AND (frequency IS NULL) AND (target_value IS NULL) AND (target_unit IS NULL) AND (target_period IS NULL))
  );

CREATE TABLE public.goal_metrics_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- 'time' inputs/displays as mm:ss but stores seconds in logs.value;
  -- 'number' is a plain value with a free-text unit label (reps, lbs,
  -- meters, whatever the metric needs).
  value_type text NOT NULL DEFAULT 'number' CHECK (value_type = ANY (ARRAY['time'::text, 'number'::text])),
  unit text,
  target_value numeric,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goal_metric_logs_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id uuid NOT NULL REFERENCES public.goal_metrics_v2(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.goals_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  note text,
  logged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_metrics_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_metric_logs_v2 ENABLE ROW LEVEL SECURITY;

-- Same self-only shape as goal_progress_v2/goal_checkins_v2, auth.uid()
-- pre-wrapped in (select ...) from the start this time rather than
-- needing a follow-up initplan-caching pass.
CREATE POLICY goal_metrics_v2_own ON public.goal_metrics_v2
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY goal_metric_logs_v2_own ON public.goal_metric_logs_v2
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE INDEX idx_goal_metrics_v2_goal_id ON public.goal_metrics_v2 (goal_id);
CREATE INDEX idx_goal_metrics_v2_user_id ON public.goal_metrics_v2 (user_id);
CREATE INDEX idx_goal_metric_logs_v2_metric_id ON public.goal_metric_logs_v2 (metric_id);
CREATE INDEX idx_goal_metric_logs_v2_goal_id ON public.goal_metric_logs_v2 (goal_id);
CREATE INDEX idx_goal_metric_logs_v2_user_id ON public.goal_metric_logs_v2 (user_id);
