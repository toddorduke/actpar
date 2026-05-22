-- ── Seed: ActPar system accounts + starter feed posts ────────────────────────
-- Run once in the Supabase SQL editor. Safe to re-run (ON CONFLICT DO NOTHING).

-- 1. Create system users in auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'motivation@actpar.internal', '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}', false
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'wins@actpar.internal', '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}', false
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'spotlight@actpar.internal', '',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}', false
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Create profiles for system accounts
INSERT INTO profiles (id, first_name, last_name, onboarding_complete, profile_setup_complete, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Marcus', 'Webb',    true, true, now()),
  ('a0000000-0000-0000-0000-000000000002', 'Destiny', 'Reyes',  true, true, now()),
  ('a0000000-0000-0000-0000-000000000003', 'Jordan', 'Brooks',  true, true, now())
ON CONFLICT (id) DO NOTHING;

-- 3. Insert seed feed posts (varied types, realistic content, staggered timestamps)
INSERT INTO tribe_posts (user_id, content, post_type, milestone, likes, created_at) VALUES

-- Marcus Webb posts
(
  'a0000000-0000-0000-0000-000000000001',
  'Day 47 of no alcohol. I won''t lie — last night was hard. Friends at the bar, everyone else drinking. I ordered water and stayed two hours. That''s the win. Nobody sees the small moments but they''re the whole thing.',
  'general', null, 14,
  now() - interval '2 hours'
),
(
  'a0000000-0000-0000-0000-000000000001',
  '90 days. Three months ago I couldn''t go one weekend. Now I don''t even think about it the same way. Accountability here was a huge part of that. If you''re early in the journey — keep logging. It adds up.',
  'achievement', '90 Days Sober',  31,
  now() - interval '4 days'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Morning run done before 6am. Cold, dark, didn''t want to. Did it anyway. That gap between what you feel like doing and what you actually do — that''s where character lives.',
  'general', null, 9,
  now() - interval '1 day'
),

-- Destiny Reyes posts
(
  'a0000000-0000-0000-0000-000000000002',
  'Saved $400 this month. Didn''t go out twice when I wanted to. Brought lunch every day. It''s not glamorous but it''s real. Financial freedom is built in boring decisions.',
  'general', null, 22,
  now() - interval '3 hours'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Hit my first $1,000 emergency fund 💰 Took 4 months of small transfers. Starting from literally zero. If you told me a year ago I''d have a thousand dollars sitting untouched I would have laughed. We move.',
  'achievement', '$1,000 Emergency Fund',  47,
  now() - interval '6 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Journaling every morning for 30 days straight. Some days it''s two sentences. Some days it''s two pages. Just the act of sitting down and being honest with yourself is underrated therapy.',
  'achievement', '30-Day Journal Streak', 18,
  now() - interval '2 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Check-in 19. Fitness goal. Missed a week in March and was ready to quit entirely. Didn''t. Picked back up. 19 days is not a streak — it''s a comeback. Those count more.',
  'general', null, 11,
  now() - interval '5 hours'
),

-- Jordan Brooks posts
(
  'a0000000-0000-0000-0000-000000000003',
  'Week 8 of the reading goal. Just finished my 6th book. Mostly non-fiction — finance, psychology, a little philosophy. The compounding effect on how I think is real. Read something this week.',
  'general', null, 16,
  now() - interval '1 hour'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Lost 20 lbs since January. No crazy diet. Just: tracked calories, walked 8k steps a day, stopped drinking soda. Boring works. Dramatic doesn''t.',
  'achievement', '20 lbs Down', 63,
  now() - interval '8 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Prayer and meditation streak at 55 days. Some days it''s 5 minutes and I''m distracted the whole time. Still counts. Consistency over perfection every time.',
  'general', null, 24,
  now() - interval '30 minutes'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Got the promotion. 14 months of showing up early, taking on extra projects, not complaining when I was overlooked. The compounding of doing the right thing quietly — it pays.',
  'achievement', 'Got the Promotion', 89,
  now() - interval '11 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Gym streak day 33. My body doesn''t look different yet. My mind does. The discipline carries over into everything — work, sleep, how I handle stress. That''s the real ROI.',
  'general', null, 19,
  now() - interval '7 hours'
);
