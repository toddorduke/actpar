-- goals, checkin_logs, and goal_progress were kept as a rollback net after
-- the goals_v2 migration. Confirmed safe to drop: all data already copied
-- (209 goals, 8 checkins, 0 goal_progress rows -- exactly what the
-- migration moved), no triggers/views/functions reference them anymore,
-- and the only two edge functions still querying them (journey-deadline,
-- weekly-digest) were fixed to use goals_v2/goal_checkins_v2 in this same
-- pass, along with a real live bug this surfaced: partnerships.goal_id_1/2
-- still had a foreign key into `goals`, which silently broke linking any
-- goal created after the migration to a Journey partnership (fixed to
-- reference goals_v2 first).
drop table if exists checkin_logs;
drop table if exists goal_progress;
drop table if exists goals;
