-- ── Re-seed: delete old system posts and reinsert with hashtags ────────────────
-- Safe to run; only touches the 3 system accounts.

DELETE FROM tribe_posts WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003'
);

INSERT INTO tribe_posts (user_id, content, post_type, milestone, likes, created_at) VALUES

-- ── Marcus Webb ───────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Day 47 of no alcohol. I won''t lie — last night was hard. Friends at the bar, everyone else drinking. I ordered water and stayed two hours. That''s the win. Nobody sees the small moments but they''re the whole thing. #sobriety #discipline #smallwins',
  'general', null, 14, now() - interval '2 hours'
),
(
  'a0000000-0000-0000-0000-000000000001',
  '90 days. Three months ago I couldn''t go one weekend. Now I don''t even think about it the same way. Accountability here was a huge part of that. If you''re early in the journey — keep logging. It adds up. #sobriety #milestone #accountability',
  'achievement', '90 Days Sober', 31, now() - interval '4 days'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Morning run done before 6am. Cold, dark, didn''t want to. Did it anyway. That gap between what you feel like doing and what you actually do — that''s where character lives. #morningrun #discipline #consistency',
  'general', null, 9, now() - interval '1 day'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Hosting a free accountability meetup this Saturday at Riverside Park, 8am. Bring your current goal written down and we''ll pair up for the next 30 days. All levels, all goals welcome. DM me if you''re coming so I can plan headcount. #accountability #meetup #community',
  'meetup', null, 27, now() - interval '6 hours'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Finance accountability circle — 4 spots left. We meet every 2 weeks on Google Meet, share our budget numbers and progress honestly, no judgment. Zero cost, just commitment. Focused on getting out of debt and building savings. Comment below if interested. #accountability #financialfreedom #community',
  'meetup', null, 41, now() - interval '3 days'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Paid off my credit card. $4,200 gone. Took 14 months of extra payments and saying no to stuff. The number is small compared to what some people carry but it was my whole cloud. I feel lighter. #debtfree #financialfreedom #milestone',
  'achievement', 'Credit Card Paid Off', 76, now() - interval '10 hours'
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Finished my first online course — Python for data analysis. Took 3 months working around my full-time job, 45 mins a night. Got the certificate. Starting the next one Monday. Skills compound. #learning #selfimprovement #milestone',
  'achievement', 'Python Course Certified', 33, now() - interval '6 days'
),

-- ── Destiny Reyes ─────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000002',
  'Saved $400 this month. Didn''t go out twice when I wanted to. Brought lunch every day. It''s not glamorous but it''s real. Financial freedom is built in boring decisions. #savings #financialfreedom #budgeting',
  'general', null, 22, now() - interval '3 hours'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Hit my first $1,000 emergency fund 💰 Took 4 months of small transfers. Starting from literally zero. If you told me a year ago I''d have a thousand dollars sitting untouched I would have laughed. We move. #savings #milestone #financialfreedom',
  'achievement', '$1,000 Emergency Fund', 47, now() - interval '6 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Journaling every morning for 30 days straight. Some days it''s two sentences. Some days it''s two pages. Just the act of sitting down and being honest with yourself is underrated therapy. #journaling #mindset #consistency',
  'achievement', '30-Day Journal Streak', 18, now() - interval '2 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Check-in 19. Fitness goal. Missed a week in March and was ready to quit entirely. Didn''t. Picked back up. 19 days is not a streak — it''s a comeback. Those count more. #fitness #comeback #consistency',
  'general', null, 11, now() - interval '5 hours'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Virtual goal-setting session this Sunday at 7pm EST via Zoom. We''ll do a 60-minute structured session: review the past month, set 3 concrete goals for June, and each pair up with an accountability partner. Link in my profile bio. #goalsetting #accountability #meetup',
  'meetup', null, 34, now() - interval '1 day'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Last Saturday''s meetup recap: 11 people showed up, talked goals, set pacts, and two people exchanged numbers to be daily check-in partners. That energy was real. Next one is in 3 weeks — same spot, Midtown Community Center, Room B. Details coming. #accountability #community #meetup',
  'meetup', null, 52, now() - interval '5 days'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'One year since I quit smoking. 365 days. Saved $2,600 according to the calculator. Lungs actually work now. I almost caved twice — once at a wedding and once after a rough week. Didn''t. One year. #smokefree #sobriety #milestone',
  'achievement', '1 Year Smoke-Free', 94, now() - interval '7 hours'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Woke up before 6am every day for 60 days. No snooze. I''m not a morning person — that was the whole point. 60 days of proving to myself I can do the thing I said I couldn''t. The morning hours are mine now. #earlyrise #discipline #consistency',
  'achievement', '60-Day Early Rise Streak', 44, now() - interval '9 hours'
),

-- ── Jordan Brooks ─────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000003',
  'Week 8 of the reading goal. Just finished my 6th book. Mostly non-fiction — finance, psychology, a little philosophy. The compounding effect on how I think is real. Read something this week. #reading #mindset #selfimprovement',
  'general', null, 16, now() - interval '1 hour'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Lost 20 lbs since January. No crazy diet. Just: tracked calories, walked 8k steps a day, stopped drinking soda. Boring works. Dramatic doesn''t. #fitness #weightloss #milestone',
  'achievement', '20 lbs Down', 63, now() - interval '8 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Prayer and meditation streak at 55 days. Some days it''s 5 minutes and I''m distracted the whole time. Still counts. Consistency over perfection every time. #meditation #mindset #consistency',
  'general', null, 24, now() - interval '30 minutes'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Got the promotion. 14 months of showing up early, taking on extra projects, not complaining when I was overlooked. The compounding of doing the right thing quietly — it pays. #career #discipline #milestone',
  'achievement', 'Got the Promotion', 89, now() - interval '11 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Gym streak day 33. My body doesn''t look different yet. My mind does. The discipline carries over into everything — work, sleep, how I handle stress. That''s the real ROI. #fitness #gym #discipline',
  'general', null, 19, now() - interval '7 hours'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Morning run group — Chicago South Side — every Tuesday and Thursday 5:45am, meeting at the Lakefront Trail entrance on 31st. All paces welcome. We end at a coffee shop. 6 weeks running now, come join us. #morningrun #fitness #community',
  'meetup', null, 19, now() - interval '2 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Sober social this Friday — coffee and conversation, no alcohol obviously. For anyone working a sobriety goal who''s tired of feeling left out of everything. Uptown Coffee House, 6pm. Casual, come as you are. #sobriety #community #meetup',
  'meetup', null, 38, now() - interval '4 days'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'First 5K done. 34 minutes and I looked terrible doing it but I crossed the finish line. Six months ago I couldn''t run to the end of the block. Progress is progress. #fitness #running #milestone',
  'achievement', 'First 5K Complete', 58, now() - interval '3 days'
);
