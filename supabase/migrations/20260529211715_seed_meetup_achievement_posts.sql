-- ── Seed: Meetup + additional achievement posts for Tribe page preview ─────────
-- Requires the 3 system accounts from 20260522_seed_feed_posts.sql.
-- Safe to run once — no unique constraint on tribe_posts content so avoid re-running.

INSERT INTO tribe_posts (user_id, content, post_type, milestone, likes, created_at) VALUES

-- ── MEETUP posts ──────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Hosting a free accountability meetup this Saturday at Riverside Park, 8am. Bring your current goal written down and we''ll pair up for the next 30 days. All levels, all goals welcome. DM me if you''re coming so I can plan headcount.',
  'meetup', null, 27,
  now() - interval '6 hours'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Virtual goal-setting session this Sunday at 7pm EST via Zoom. We''ll do a 60-minute structured session: review the past month, set 3 concrete goals for June, and each pair up with an accountability partner. Link in my profile bio.',
  'meetup', null, 34,
  now() - interval '1 day'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Morning run group — Chicago South Side — every Tuesday and Thursday 5:45am, meeting at the Lakefront Trail entrance on 31st. All paces welcome. We end at a coffee shop. 6 weeks running now, come join us.',
  'meetup', null, 19,
  now() - interval '2 days'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Finance accountability circle — 4 spots left. We meet every 2 weeks on Google Meet, share our budget numbers and progress honestly, no judgment. Zero cost, just commitment. Focused on getting out of debt and building savings. Comment below if interested.',
  'meetup', null, 41,
  now() - interval '3 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Last Saturday''s meetup recap: 11 people showed up, talked goals, set pacts, and two people exchanged numbers to be daily check-in partners. That energy was real. Next one is in 3 weeks — same spot, Midtown Community Center, Room B. Details coming.',
  'meetup', null, 52,
  now() - interval '5 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Sober social this Friday — coffee and conversation, no alcohol obviously. For anyone working a sobriety goal who''s tired of feeling left out of everything. Uptown Coffee House, 6pm. Casual, come as you are.',
  'meetup', null, 38,
  now() - interval '4 days'
),

-- ── Additional ACHIEVEMENT posts ───────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000002',
  'One year since I quit smoking. 365 days. Saved $2,600 according to the calculator. Lungs actually work now. I almost caved twice — once at a wedding and once after a rough week. Didn''t. One year.',
  'achievement', '1 Year Smoke-Free', 94,
  now() - interval '7 hours'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Paid off my credit card. $4,200 gone. Took 14 months of extra payments and saying no to stuff. The number is small compared to what some people carry but it was my whole cloud. I feel lighter.',
  'achievement', 'Credit Card Paid Off', 76,
  now() - interval '10 hours'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'First 5K done. 34 minutes and I looked terrible doing it but I crossed the finish line. Six months ago I couldn''t run to the end of the block. Progress is progress.',
  'achievement', 'First 5K Complete', 58,
  now() - interval '3 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Woke up before 6am every day for 60 days. No snooze. I''m not a morning person — that was the whole point. 60 days of proving to myself I can do the thing I said I couldn''t. The morning hours are mine now.',
  'achievement', '60-Day Early Rise Streak', 44,
  now() - interval '9 hours'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Finished my first online course — Python for data analysis. Took 3 months working around my full-time job, 45 mins a night. Got the certificate. Starting the next one Monday. Skills compound.',
  'achievement', 'Python Course Certified', 33,
  now() - interval '6 days'
);
