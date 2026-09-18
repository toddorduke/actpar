-- Seed realistic content into the near-empty tables (pacts, pact_posts,
-- community_events, community_challenges, challenge_entries, reflections,
-- journal_entries, community_memberships) so the app doesn't read as a
-- freshly-installed empty shell when someone opens it. Follows the
-- existing seed convention: attributed only to the 22 pre-built persona
-- accounts (10000000-0000-0000-0000-0000000000XX), the same ones
-- seed_feed_posts/reseed_posts_with_hashtags already used for tribe_posts
-- -- never to a real signup (Anthony Coaxum, Jonathan Hop, Todd Graham,
-- etc.), whose account it isn't ours to put words in. Doesn't touch the
-- pact ("ganganga") or challenge ("Save 10,000") the real user already
-- created while testing.

-- ── Community memberships for the 12 official system communities ──
-- These currently have zero persona members, so they'd show "0 members"
-- even once populated with events/challenges below.
insert into community_memberships (community_id, user_id, role) values
  ('4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000009', 'admin'),   -- Fitness & Health: Carlos "El Toro"
  ('4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000011', 'member'),  -- Derrick "Iron Will"
  ('4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000016', 'member'),  -- Sofia "Viva Fit"
  ('4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000010', 'member'),  -- Zoe "Summit Seeker"
  ('67640ce1-0acf-407e-a118-72707fda2ef3', '10000000-0000-0000-0000-000000000014', 'admin'),   -- Faith & Spirituality: Amara "Serene Storm"
  ('67640ce1-0acf-407e-a118-72707fda2ef3', '10000000-0000-0000-0000-000000000018', 'member'),  -- Naomi "Power Within"
  ('c8b98cb3-bee1-4c39-b666-31e70a85c275', '10000000-0000-0000-0000-000000000021', 'admin'),   -- Sobriety & Recovery: Malik "Steel Mind"
  ('c8b98cb3-bee1-4c39-b666-31e70a85c275', '10000000-0000-0000-0000-000000000022', 'member'),  -- Hannah "Inner Light"
  ('0dc1b9db-be15-4888-b5d9-9ab05c6dd0d3', '10000000-0000-0000-0000-000000000012', 'admin'),   -- Mental Health: Lily "Bloom Daily"
  ('0dc1b9db-be15-4888-b5d9-9ab05c6dd0d3', '10000000-0000-0000-0000-000000000020', 'member'),  -- Isabella "La Chispa"
  ('ab6495f8-ab5a-4aa3-846c-8df3860cd01c', '10000000-0000-0000-0000-000000000001', 'member'),  -- Finance & Wealth: Marcus "The Architect"
  ('ab6495f8-ab5a-4aa3-846c-8df3860cd01c', '10000000-0000-0000-0000-000000000017', 'member'),  -- James "The Closer"
  ('eb4bd520-ce13-4b2e-b180-906786515ab0', '10000000-0000-0000-0000-000000000016', 'admin'),   -- Nutrition: Sofia "Viva Fit"
  ('eb4bd520-ce13-4b2e-b180-906786515ab0', '10000000-0000-0000-0000-000000000019', 'member'),  -- Ethan "Green Machine"
  ('262d23ef-1660-4637-9abc-d765a97ba014', '10000000-0000-0000-0000-000000000004', 'admin'),   -- Mindfulness: Maya "Lotus Fire"
  ('262d23ef-1660-4637-9abc-d765a97ba014', '10000000-0000-0000-0000-000000000014', 'member'),  -- Amara "Serene Storm"
  ('2da8d27a-c074-4bed-aa52-289411a2fff8', '10000000-0000-0000-0000-000000000003', 'admin'),   -- Reading & Learning: Jordan "The Steady"
  ('2da8d27a-c074-4bed-aa52-289411a2fff8', '10000000-0000-0000-0000-000000000007', 'member'),  -- Kai "Zero to One"
  ('40262762-8aa2-4722-8128-4315e90f9a65', '10000000-0000-0000-0000-000000000013', 'admin'),   -- Goal Setters: Tyler "The Mindset Master"
  ('40262762-8aa2-4722-8128-4315e90f9a65', '10000000-0000-0000-0000-000000000006', 'member'),  -- Emma "Phoenix Rising"
  ('40262762-8aa2-4722-8128-4315e90f9a65', '10000000-0000-0000-0000-000000000015', 'member')   -- Ryan "The Long Runner"
on conflict do nothing;

-- ── Community events ──
insert into community_events (id, community_id, created_by, title, description, location, event_date) values
  ('e0000001-0000-0000-0000-000000000001', '4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000009',
   'Saturday 6am group run', 'Easy 5K pace, all levels welcome -- we regroup at the halfway point so nobody gets dropped.', 'Riverside Park, north entrance', now() + interval '4 days' + interval '6 hours'),
  ('e0000001-0000-0000-0000-000000000002', '4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000011',
   'Form check + lifting session', 'Bring a lift you want eyes on. I''ll film and we''ll break it down together after.', 'Iron Will Gym, open floor', now() + interval '9 days' + interval '17 hours'),
  ('e0000001-0000-0000-0000-000000000003', '67640ce1-0acf-407e-a118-72707fda2ef3', '10000000-0000-0000-0000-000000000014',
   'Sunday evening reflection circle', 'Quiet space to talk through the week -- no pressure to share, just show up.', 'Community room, back entrance', now() + interval '6 days' + interval '19 hours'),
  ('e0000001-0000-0000-0000-000000000004', '0dc1b9db-be15-4888-b5d9-9ab05c6dd0d3', '10000000-0000-0000-0000-000000000012',
   'Walk & talk meetup', 'No agenda, just a slow loop around the lake and whoever wants to talk, talks.', 'Lakeside trailhead', now() + interval '2 days' + interval '18 hours'),
  ('e0000001-0000-0000-0000-000000000005', '2da8d27a-c074-4bed-aa52-289411a2fff8', '10000000-0000-0000-0000-000000000003',
   'Chapter 1 discussion: Atomic Habits', 'Just the first chapter this round -- low commitment, easy to jump in even if you''re starting late.', 'Virtual', now() + interval '11 days' + interval '20 hours'),
  ('e0000001-0000-0000-0000-000000000006', '40262762-8aa2-4722-8128-4315e90f9a65', '10000000-0000-0000-0000-000000000013',
   'Q3 goal check-in', 'Bring whatever you set out to do this quarter. We''ll go around, no judgment on where you actually landed.', 'Virtual', now() + interval '14 days' + interval '18 hours')
on conflict do nothing;

insert into event_rsvps (event_id, user_id, status) values
  ('e0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'going'),
  ('e0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000016', 'going'),
  ('e0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'maybe'),
  ('e0000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', 'going'),
  ('e0000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000018', 'going'),
  ('e0000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000020', 'going'),
  ('e0000001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', 'going'),
  ('e0000001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'going'),
  ('e0000001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'going'),
  ('e0000001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000015', 'maybe')
on conflict do nothing;

-- ── Community challenges + entries (additional to the user's own "Save 10,000") ──
insert into community_challenges (id, community_id, created_by, title, description, target_value, unit, start_date, end_date) values
  ('c0000001-0000-0000-0000-000000000001', '4179d9d0-50de-40e9-932e-1ce1c3ffa145', '10000000-0000-0000-0000-000000000009',
   '100 miles in 30 days', 'Run, walk, bike -- however you rack up the miles, log it here.', 100, 'miles', current_date - 6, current_date + 24),
  ('c0000001-0000-0000-0000-000000000002', 'eb4bd520-ce13-4b2e-b180-906786515ab0', '10000000-0000-0000-0000-000000000016',
   '30 home-cooked meals', 'One point per meal you actually cook yourself instead of ordering.', 30, 'meals', current_date - 10, current_date + 20),
  ('c0000001-0000-0000-0000-000000000003', '2da8d27a-c074-4bed-aa52-289411a2fff8', '10000000-0000-0000-0000-000000000003',
   '12 books this quarter', 'Any format counts -- audiobook, physical, e-reader.', 12, 'books', current_date - 20, current_date + 70)
on conflict do nothing;

insert into challenge_entries (challenge_id, user_id, value, note, logged_at) values
  ('c0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 8, 'Trail run, legs are toast', now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000016', 5.2, 'Slow one today, just needed to move', now() - interval '2 days'),
  ('c0000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 12, 'Hill repeats at the park', now() - interval '4 days'),
  ('c0000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000019', 1, 'Sheet pan chicken and veggies', now() - interval '1 day'),
  ('c0000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000016', 1, 'Meal prepped for the whole week', now() - interval '3 days'),
  ('c0000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', 1, 'Finished Deep Work, highly recommend', now() - interval '5 days'),
  ('c0000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 1, 'Halfway through Atomic Habits', now() - interval '2 days')
on conflict do nothing;

-- ── New Pacts (small groups) -- separate from the user's own "ganganga" ──
insert into pacts (id, name, description, created_by, is_open) values
  ('a0000002-0000-0000-0000-000000000001', 'Early Risers', 'Up before 6am, every day, no excuses. We check in the moment our feet hit the floor.', '10000000-0000-0000-0000-000000000009', true),
  ('a0000002-0000-0000-0000-000000000002', 'Sober & Steady', 'Day-by-day accountability for anyone staying sober. What''s said here stays here.', '10000000-0000-0000-0000-000000000021', false)
on conflict do nothing;

insert into pact_members (pact_id, user_id, role) values
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 'founder'),
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'co-lead'),
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'member'),
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000016', 'member'),
  ('a0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000021', 'founder'),
  ('a0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000022', 'member'),
  ('a0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000014', 'member')
on conflict do nothing;

insert into pact_rules (pact_id, rule_text, position) values
  ('a0000002-0000-0000-0000-000000000001', 'Check in within 30 minutes of waking up', 0),
  ('a0000002-0000-0000-0000-000000000001', 'No excuses posts before 6am -- if you''re late, own it and move on', 1),
  ('a0000002-0000-0000-0000-000000000001', 'Two misses in a week means a call with the group, not a text', 2),
  ('a0000002-0000-0000-0000-000000000002', 'Check in daily, even one word is enough', 0),
  ('a0000002-0000-0000-0000-000000000002', 'If you slip, tell us before you tell yourself it doesn''t matter', 1),
  ('a0000002-0000-0000-0000-000000000002', 'No judgment, ever -- this is the one place that''s true', 2)
on conflict do nothing;

insert into pact_posts (pact_id, user_id, content, post_type, milestone, likes, created_at) values
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', '5:52am. Coffee''s on, about to head out for the run. Who''s up?', 'update', null, 3, now() - interval '18 hours'),
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'Hit 30 days straight this morning. Honestly didn''t think I''d make it past week one.', 'win', '30-day streak', 7, now() - interval '2 days'),
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000016', 'Rough one today, alarm didn''t go off, up at 6:40. Still counting it, still showing up.', 'update', null, 4, now() - interval '3 days'),
  ('a0000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000010', 'The 5am wake-up doesn''t get easier, you just get more stubborn than the snooze button.', 'update', null, 5, now() - interval '5 days'),
  ('a0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000021', 'Day 47. Had a rough craving around lunch, texted the group instead of doing anything about it. That''s the whole point of this.', 'update', null, 9, now() - interval '1 day'),
  ('a0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000022', 'Six months today. Thank you for not letting me do this alone.', 'win', '6 months sober', 12, now() - interval '4 days'),
  ('a0000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000014', 'Checking in. Tired, but okay. Some days okay is the win.', 'update', null, 6, now() - interval '6 days')
on conflict do nothing;

-- ── Public reflections + journal entries ──
insert into reflections (user_id, question, answer, is_public, type, created_at) values
  ('10000000-0000-0000-0000-000000000012', 'What''s one thing you''re proud of this week?', 'I finally said no to something that was draining me and didn''t over-explain myself. Small, but it felt huge.', true, 'reflection', now() - interval '2 days'),
  ('10000000-0000-0000-0000-000000000020', 'What''s been harder than you expected?', 'Staying consistent when nobody''s watching. It''s easy to show up when there''s an audience -- the quiet days are the real test.', true, 'reflection', now() - interval '4 days'),
  ('10000000-0000-0000-0000-000000000005', 'What advice would you give someone just starting out?', 'Pick the smallest version of the habit you can imagine, then do that for a month before you try to scale it up.', true, 'reflection', now() - interval '6 days'),
  ('10000000-0000-0000-0000-000000000004', 'How do you handle a day where motivation is gone?', 'I stopped waiting for motivation. I just ask myself what the 2-minute version of the task looks like, and do that.', true, 'reflection', now() - interval '9 days')
on conflict do nothing;

insert into journal_entries (user_id, subject, body, is_public, created_at) values
  ('10000000-0000-0000-0000-000000000006', 'Week 3, and it''s starting to click', 'I almost quit after week one. Nothing felt different yet. But this week I caught myself doing the habit without having to think about it first, and that''s when it clicked -- this is just who I am now, not something I''m forcing.', true, now() - interval '3 days'),
  ('10000000-0000-0000-0000-000000000015', 'The run that almost didn''t happen', 'It was raining, I was tired, and I had every reason to skip it. Went anyway. Best run I''ve had in weeks. Funny how the ones you almost skip turn out to be the ones you needed most.', true, now() - interval '5 days'),
  ('10000000-0000-0000-0000-000000000001', 'Numbers don''t lie, but they don''t tell the whole story either', 'Hit my savings goal for the month, which should feel great, and it does, but I also want to remember the months it didn''t work and I kept going anyway. That''s the part that actually mattered.', true, now() - interval '8 days')
on conflict do nothing;
