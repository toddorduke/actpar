-- A real, complete example of the new 'multi' goal type -- the 8
-- standard HYROX stations, each with a target time and a few realistic
-- logged sessions showing improvement over time. Attributed to the same
-- persona-account convention as the rest of this repo's seed data (see
-- 20260918172357_seed_content_for_empty_tables.sql), archived one of
-- Marcus's duplicate "Weekly meal prep Sundays" habit goals to make room
-- under the 2-active-goal free-tier cap.

UPDATE public.goals_v2 SET status = 'archived' WHERE id = '4809ccbb-ed5a-44d0-9218-a9725df2b8f0';

INSERT INTO public.goals_v2 (id, user_id, title, tag, goal_type, status) VALUES
  ('dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'HYROX Training', 'fitness', 'multi', 'active');

INSERT INTO public.goal_metrics_v2 (id, goal_id, user_id, name, value_type, unit, target_value, position) VALUES
  ('3bf63e33-1a60-4d83-8658-9425160b1ef0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'SkiErg 1000m', 'time', null, 240, 0),
  ('59d2418a-3529-46bf-bbfa-cddfa496bfe6', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Sled Push 50m', 'time', null, 90, 1),
  ('79accd1d-c452-460f-8c7c-32a1de2e2207', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Sled Pull 50m', 'time', null, 100, 2),
  ('499166f3-510c-4fbb-af89-6a2b8ae9250f', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Burpee Broad Jumps 80m', 'time', null, 180, 3),
  ('24d9b280-91c2-4259-b29b-2f60ae1c6700', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Rowing 1000m', 'time', null, 230, 4),
  ('381d1d2c-11c1-4dc7-9097-803703424ee0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Farmers Carry 200m', 'time', null, 110, 5),
  ('245e16db-ff24-4128-af49-0f3be2050ba4', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Sandbag Lunges 100m', 'time', null, 150, 6),
  ('5ac395fb-96c6-4851-9aa9-6ede24e126d0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 'Wall Balls (100 reps)', 'time', null, 300, 7);

INSERT INTO public.goal_metric_logs_v2 (metric_id, goal_id, user_id, value, note, logged_at) VALUES
  ('3bf63e33-1a60-4d83-8658-9425160b1ef0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 262, 'first time on the erg in weeks', now() - interval '12 days'),
  ('3bf63e33-1a60-4d83-8658-9425160b1ef0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 251, null, now() - interval '5 days'),
  ('3bf63e33-1a60-4d83-8658-9425160b1ef0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 244, 'felt smooth, good pacing', now() - interval '1 days'),

  ('59d2418a-3529-46bf-bbfa-cddfa496bfe6', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 105, 'sled felt heavy today', now() - interval '12 days'),
  ('59d2418a-3529-46bf-bbfa-cddfa496bfe6', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 96, null, now() - interval '5 days'),
  ('59d2418a-3529-46bf-bbfa-cddfa496bfe6', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 93, null, now() - interval '1 days'),

  ('79accd1d-c452-460f-8c7c-32a1de2e2207', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 118, null, now() - interval '12 days'),
  ('79accd1d-c452-460f-8c7c-32a1de2e2207', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 107, 'grip strength is the limiter', now() - interval '1 days'),

  ('499166f3-510c-4fbb-af89-6a2b8ae9250f', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 205, null, now() - interval '12 days'),
  ('499166f3-510c-4fbb-af89-6a2b8ae9250f', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 188, 'legs were toast after this one', now() - interval '1 days'),

  ('24d9b280-91c2-4259-b29b-2f60ae1c6700', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 248, null, now() - interval '12 days'),
  ('24d9b280-91c2-4259-b29b-2f60ae1c6700', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 233, null, now() - interval '1 days'),

  ('381d1d2c-11c1-4dc7-9097-803703424ee0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 122, 'switched to a double overhand grip', now() - interval '5 days'),

  ('245e16db-ff24-4128-af49-0f3be2050ba4', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 168, null, now() - interval '5 days'),

  ('5ac395fb-96c6-4851-9aa9-6ede24e126d0', 'dab0bd7b-fa62-41df-a7c3-53bbaaf91c50', '10000000-0000-0000-0000-000000000001', 312, 'no-rep city, need to fix my depth', now() - interval '5 days');
