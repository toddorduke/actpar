-- ============================================================
-- GoalTracker Demo Seed Data
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Demo Login 1:  demo@goaltracker.app   /  Demo1234!
-- Demo Login 2:  coach@goaltracker.app  /  Demo1234!
-- ============================================================


-- ── STEP 1: Auth Users ──────────────────────────────────────
-- 2 real login accounts + 20 browseable fake profiles

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_super_admin
) VALUES

-- Demo login accounts
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated',
 'demo@goaltracker.app', crypt('Demo1234!', gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '90 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000002','authenticated','authenticated',
 'coach@goaltracker.app', crypt('Demo1234!', gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '120 days', now(), false),

-- Browse profiles (no login needed — swipeable cards)
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000003','authenticated','authenticated',
 'jordan.lee@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '60 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000004','authenticated','authenticated',
 'maya.patel@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '75 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000005','authenticated','authenticated',
 'alex.rivera@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '180 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000006','authenticated','authenticated',
 'emma.thompson@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '55 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000007','authenticated','authenticated',
 'kai.nakamura@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '40 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000008','authenticated','authenticated',
 'priya.singh@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '95 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000009','authenticated','authenticated',
 'carlos.martinez@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '30 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000010','authenticated','authenticated',
 'zoe.williams@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '70 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000011','authenticated','authenticated',
 'derrick.foster@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '150 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000012','authenticated','authenticated',
 'lily.chen@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '45 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000013','authenticated','authenticated',
 'tyler.brooks@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '220 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000014','authenticated','authenticated',
 'amara.jackson@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '50 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000015','authenticated','authenticated',
 'ryan.obrien@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '85 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000016','authenticated','authenticated',
 'sofia.rodriguez@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '65 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000017','authenticated','authenticated',
 'james.kim@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '25 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000018','authenticated','authenticated',
 'naomi.washington@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '110 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000019','authenticated','authenticated',
 'ethan.cooper@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '48 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000020','authenticated','authenticated',
 'isabella.torres@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '35 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000021','authenticated','authenticated',
 'malik.brown@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '100 days', now(), false),

('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000022','authenticated','authenticated',
 'hannah.mitchell@demo.internal', crypt(gen_random_uuid()::text, gen_salt('bf')),
 now(),'{"provider":"email","providers":["email"]}','{}', now() - interval '58 days', now(), false)

ON CONFLICT (id) DO NOTHING;


-- ── STEP 2: Auth Identities (needed for the 2 login accounts) ──
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES
('10000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001',
 'demo@goaltracker.app',
 '{"sub":"10000000-0000-0000-0000-000000000001","email":"demo@goaltracker.app"}',
 'email', now(), now(), now()),

('10000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000002',
 'coach@goaltracker.app',
 '{"sub":"10000000-0000-0000-0000-000000000002","email":"coach@goaltracker.app"}',
 'email', now(), now(), now())

ON CONFLICT (id) DO NOTHING;


-- ── STEP 3: Profiles ────────────────────────────────────────
INSERT INTO profiles (
  id, first_name, last_name, alter_ego_name, age, city, account_type, tagline, avatar_url
) VALUES

('10000000-0000-0000-0000-000000000001',
 'Marcus', 'Johnson', 'The Architect', 32, 'New York, NY', 'Personal',
 'Building systems that outlast motivation. Architect by trade, goal crusher by choice.',
 'https://randomuser.me/api/portraits/men/32.jpg'),

('10000000-0000-0000-0000-000000000002',
 'Sarah', 'Williams', 'Coach Bloom', 35, 'Los Angeles, CA', 'Coach',
 'Certified transformation coach. I have helped 200+ people lose weight and gain real confidence.',
 'https://randomuser.me/api/portraits/women/44.jpg'),

('10000000-0000-0000-0000-000000000003',
 'Jordan', 'Lee', 'The Steady', 27, 'New York, NY', 'Personal',
 'Running toward a better version of myself, one mile and one habit at a time.',
 'https://randomuser.me/api/portraits/men/11.jpg'),

('10000000-0000-0000-0000-000000000004',
 'Maya', 'Patel', 'Lotus Fire', 29, 'Los Angeles, CA', 'Personal',
 'Mind, body, and soul alignment. Yoga teacher in training, full-time dream chaser.',
 'https://randomuser.me/api/portraits/women/26.jpg'),

('10000000-0000-0000-0000-000000000005',
 'Alex', 'Rivera', 'The Catalyst', 38, 'Miami, FL', 'Coach',
 '10 years in fitness. I turn excuses into results. Let''s get uncomfortable together.',
 'https://randomuser.me/api/portraits/men/54.jpg'),

('10000000-0000-0000-0000-000000000006',
 'Emma', 'Thompson', 'Phoenix Rising', 44, 'Chicago, IL', 'Personal',
 'Down 40 lbs and counting. Proving every single day that it is never too late to start.',
 'https://randomuser.me/api/portraits/women/17.jpg'),

('10000000-0000-0000-0000-000000000007',
 'Kai', 'Nakamura', 'Zero to One', 26, 'Seattle, WA', 'Personal',
 'Software engineer turned mindset obsessive. Optimizing life the same way I optimize code.',
 'https://randomuser.me/api/portraits/men/78.jpg'),

('10000000-0000-0000-0000-000000000008',
 'Priya', 'Singh', 'The Nurturer', 31, 'Austin, TX', 'Coach',
 'Functional nutrition coach. Food is medicine — let me show you exactly how to use it.',
 'https://randomuser.me/api/portraits/women/62.jpg'),

('10000000-0000-0000-0000-000000000009',
 'Carlos', 'Martinez', 'El Toro', 28, 'Houston, TX', 'Personal',
 'First-gen college grad chasing financial freedom. Turning my side hustle into my main hustle.',
 'https://randomuser.me/api/portraits/men/41.jpg'),

('10000000-0000-0000-0000-000000000010',
 'Zoe', 'Williams', 'Summit Seeker', 33, 'Denver, CO', 'Personal',
 'Mountains are my therapy. 14ers, trail runs, and cold plunges are my daily reset button.',
 'https://randomuser.me/api/portraits/women/33.jpg'),

('10000000-0000-0000-0000-000000000011',
 'Derrick', 'Foster', 'Iron Will', 36, 'Atlanta, GA', 'Personal',
 '330 lbs to 240 lbs in 18 months. Iron does not lie. Neither do I.',
 'https://randomuser.me/api/portraits/men/22.jpg'),

('10000000-0000-0000-0000-000000000012',
 'Lily', 'Chen', 'Bloom Daily', 25, 'San Francisco, CA', 'Personal',
 'Building my startup one rejection at a time. Failure is just data with feelings.',
 'https://randomuser.me/api/portraits/women/55.jpg'),

('10000000-0000-0000-0000-000000000013',
 'Tyler', 'Brooks', 'The Mindset Master', 40, 'Dallas, TX', 'Coach',
 'Former D1 athlete turned mindset coach. Your limiting beliefs are my specialty.',
 'https://randomuser.me/api/portraits/men/67.jpg'),

('10000000-0000-0000-0000-000000000014',
 'Amara', 'Jackson', 'Serene Storm', 30, 'Phoenix, AZ', 'Personal',
 'Chronic illness warrior finding peace through movement. Yoga is my daily anchor.',
 'https://randomuser.me/api/portraits/women/81.jpg'),

('10000000-0000-0000-0000-000000000015',
 'Ryan', 'O''Brien', 'The Long Runner', 34, 'Boston, MA', 'Personal',
 'Training for my third Boston Marathon. 26.2 miles is just 26 miles and a walk.',
 'https://randomuser.me/api/portraits/men/36.jpg'),

('10000000-0000-0000-0000-000000000016',
 'Sofia', 'Rodriguez', 'Viva Fit', 27, 'San Diego, CA', 'Personal',
 'Nutritionist and dance fitness instructor. Healthy living should feel like a party.',
 'https://randomuser.me/api/portraits/women/48.jpg'),

('10000000-0000-0000-0000-000000000017',
 'James', 'Kim', 'The Closer', 37, 'Las Vegas, NV', 'Personal',
 'Sales exec by day, entrepreneur by night. Closing deals and opening new chapters.',
 'https://randomuser.me/api/portraits/men/59.jpg'),

('10000000-0000-0000-0000-000000000018',
 'Naomi', 'Washington', 'Power Within', 42, 'Charlotte, NC', 'Coach',
 'Lost 60 lbs. Became a coach. Now I help women rebuild their relationship with their body.',
 'https://randomuser.me/api/portraits/women/71.jpg'),

('10000000-0000-0000-0000-000000000019',
 'Ethan', 'Cooper', 'Green Machine', 29, 'Portland, OR', 'Personal',
 'Zero waste, zero excuses. Sustainable living is not a trend — it is the mission.',
 'https://randomuser.me/api/portraits/men/83.jpg'),

('10000000-0000-0000-0000-000000000020',
 'Isabella', 'Torres', 'La Chispa', 24, 'Orlando, FL', 'Personal',
 'Salsa dancer, gym rat, and recovering perfectionist. Moving my way to freedom.',
 'https://randomuser.me/api/portraits/women/39.jpg'),

('10000000-0000-0000-0000-000000000021',
 'Malik', 'Brown', 'Steel Mind', 31, 'Detroit, MI', 'Personal',
 'Discipline over motivation, every single day. No shortcuts, no excuses, no complaints.',
 'https://randomuser.me/api/portraits/men/91.jpg'),

('10000000-0000-0000-0000-000000000022',
 'Hannah', 'Mitchell', 'Inner Light', 33, 'Nashville, TN', 'Personal',
 'Therapist and wellness advocate. Mental health is the foundation of everything else.',
 'https://randomuser.me/api/portraits/women/12.jpg')

ON CONFLICT (id) DO UPDATE SET
  first_name    = EXCLUDED.first_name,
  last_name     = EXCLUDED.last_name,
  alter_ego_name = EXCLUDED.alter_ego_name,
  age           = EXCLUDED.age,
  city          = EXCLUDED.city,
  account_type  = EXCLUDED.account_type,
  tagline       = EXCLUDED.tagline,
  avatar_url    = EXCLUDED.avatar_url;


-- ── STEP 4: Goals ───────────────────────────────────────────
INSERT INTO goals (id, user_id, title, tier, is_active, day_count, created_at, updated_at)
VALUES

-- Marcus (demo user)
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','Cold shower every morning',1,true,47,now()-interval '47 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','Read 30 minutes daily',2,true,32,now()-interval '32 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','Weekly meal prep Sundays',3,true,15,now()-interval '15 days',now()),

-- Sarah (demo coach)
(gen_random_uuid(),'10000000-0000-0000-0000-000000000002','Client check-in calls daily',1,true,68,now()-interval '68 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000002','Workout 5x per week',2,true,54,now()-interval '54 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000002','Meditation before bed',3,true,29,now()-interval '29 days',now()),

-- Jordan
(gen_random_uuid(),'10000000-0000-0000-0000-000000000003','Run 3 miles every morning',1,true,28,now()-interval '28 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000003','No sugar after 7pm',2,true,14,now()-interval '14 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000003','Journal daily',3,true,21,now()-interval '21 days',now()),

-- Maya
(gen_random_uuid(),'10000000-0000-0000-0000-000000000004','Daily yoga practice',1,true,89,now()-interval '89 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000004','Meditate 20 minutes',2,true,45,now()-interval '45 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000004','Plant-based meals',3,true,12,now()-interval '12 days',now()),

-- Alex (coach)
(gen_random_uuid(),'10000000-0000-0000-0000-000000000005','Train 6 clients per day',1,true,120,now()-interval '120 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000005','Personal morning workout',2,true,87,now()-interval '87 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000005','Nutrition log daily',3,true,61,now()-interval '61 days',now()),

-- Emma
(gen_random_uuid(),'10000000-0000-0000-0000-000000000006','Walk 10,000 steps daily',1,true,34,now()-interval '34 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000006','Track calories every meal',2,true,22,now()-interval '22 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000006','Zero fast food',3,true,17,now()-interval '17 days',now()),

-- Kai
(gen_random_uuid(),'10000000-0000-0000-0000-000000000007','Deep work 2 hours daily',1,true,55,now()-interval '55 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000007','Read a technical book',2,true,41,now()-interval '41 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000007','No phone before 9am',3,true,8,now()-interval '8 days',now()),

-- Priya (coach)
(gen_random_uuid(),'10000000-0000-0000-0000-000000000008','Meal plan for clients',1,true,76,now()-interval '76 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000008','Personal clean eating',2,true,63,now()-interval '63 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000008','Morning walk 30 min',3,true,44,now()-interval '44 days',now()),

-- Carlos
(gen_random_uuid(),'10000000-0000-0000-0000-000000000009','Save $500 every month',1,true,19,now()-interval '19 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000009','Work on side business 1hr/day',2,true,14,now()-interval '14 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000009','Track every expense',3,true,9,now()-interval '9 days',now()),

-- Zoe
(gen_random_uuid(),'10000000-0000-0000-0000-000000000010','Hike every weekend',1,true,62,now()-interval '62 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000010','Cold plunge 3x per week',2,true,23,now()-interval '23 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000010','Evening stretch routine',3,true,38,now()-interval '38 days',now()),

-- Derrick
(gen_random_uuid(),'10000000-0000-0000-0000-000000000011','Lift heavy 5x per week',1,true,127,now()-interval '127 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000011','Eat 200g protein daily',2,true,89,now()-interval '89 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000011','Sleep 8 hours every night',3,true,41,now()-interval '41 days',now()),

-- Lily
(gen_random_uuid(),'10000000-0000-0000-0000-000000000012','Work on startup 3hrs/day',1,true,31,now()-interval '31 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000012','Network with 1 new person daily',2,true,18,now()-interval '18 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000012','Morning journaling',3,true,25,now()-interval '25 days',now()),

-- Tyler (coach)
(gen_random_uuid(),'10000000-0000-0000-0000-000000000013','Morning mindset routine',1,true,200,now()-interval '200 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000013','Coach 5 clients daily',2,true,156,now()-interval '156 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000013','Evening review and planning',3,true,98,now()-interval '98 days',now()),

-- Amara
(gen_random_uuid(),'10000000-0000-0000-0000-000000000014','30-min yoga every morning',1,true,44,now()-interval '44 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000014','Gratitude journaling',2,true,38,now()-interval '38 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000014','Digital detox 1hr/day',3,true,20,now()-interval '20 days',now()),

-- Ryan
(gen_random_uuid(),'10000000-0000-0000-0000-000000000015','Run 8 miles on weekdays',1,true,73,now()-interval '73 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000015','Cross-train 2x per week',2,true,51,now()-interval '51 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000015','Ice bath recovery',3,true,16,now()-interval '16 days',now()),

-- Sofia
(gen_random_uuid(),'10000000-0000-0000-0000-000000000016','Dance fitness class daily',1,true,58,now()-interval '58 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000016','Meal prep every Sunday',2,true,45,now()-interval '45 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000016','Drink 3L of water daily',3,true,33,now()-interval '33 days',now()),

-- James
(gen_random_uuid(),'10000000-0000-0000-0000-000000000017','Make 50 sales calls daily',1,true,22,now()-interval '22 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000017','Read one business book/month',2,true,17,now()-interval '17 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000017','Review business metrics nightly',3,true,11,now()-interval '11 days',now()),

-- Naomi (coach)
(gen_random_uuid(),'10000000-0000-0000-0000-000000000018','Morning group coaching session',1,true,91,now()-interval '91 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000018','Personal workout daily',2,true,78,now()-interval '78 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000018','Evening reflection journal',3,true,52,now()-interval '52 days',now()),

-- Ethan
(gen_random_uuid(),'10000000-0000-0000-0000-000000000019','Zero single-use plastic daily',1,true,43,now()-interval '43 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000019','Bike to work',2,true,36,now()-interval '36 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000019','Tend to the garden daily',3,true,22,now()-interval '22 days',now()),

-- Isabella
(gen_random_uuid(),'10000000-0000-0000-0000-000000000020','Salsa practice 1 hour',1,true,29,now()-interval '29 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000020','Gym workout 5x per week',2,true,21,now()-interval '21 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000020','Daily positive affirmations',3,true,14,now()-interval '14 days',now()),

-- Malik
(gen_random_uuid(),'10000000-0000-0000-0000-000000000021','5am wake-up every day',1,true,84,now()-interval '84 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000021','No phone first 2 hours',2,true,67,now()-interval '67 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000021','Evening weight training',3,true,49,now()-interval '49 days',now()),

-- Hannah
(gen_random_uuid(),'10000000-0000-0000-0000-000000000022','Daily therapy journaling',1,true,56,now()-interval '56 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000022','30-min walk outside',2,true,48,now()-interval '48 days',now()),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000022','Digital sunset at 9pm',3,true,31,now()-interval '31 days',now());


-- ── STEP 5: Tribe Posts ─────────────────────────────────────
INSERT INTO tribe_posts (id, user_id, content, post_type, milestone, likes, created_at)
VALUES

(gen_random_uuid(),'10000000-0000-0000-0000-000000000011',
 'Just hit day 127 of lifting. I was 330 lbs when I started. I am 240 lbs today. Iron does not lie and neither does consistency. If I can do it, you can too.',
 'achievement','330 lbs → 240 lbs in 18 months',89, now()-interval '2 hours'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000002',
 'Had a client hit her goal weight today after 6 months of working together. She walked in crying happy tears this morning. This is exactly why I do what I do.',
 'achievement','Client hit goal weight',74, now()-interval '5 hours'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000021',
 'Day 84 waking up at 5am. No alarm anymore — my body just knows. Discipline eventually becomes identity. Start the streak.',
 'general',null,61, now()-interval '8 hours'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000004',
 '89 consecutive days of yoga. My anxiety is at an all-time low. My focus is sharper than it has ever been. If you are struggling mentally, start by moving your body.',
 'achievement','89-day yoga streak',58, now()-interval '12 hours'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000006',
 'Down 40 pounds!! I still cannot believe it when I look in the mirror. This community kept me accountable on the days I wanted to quit. Thank you all so much.',
 'achievement','Lost 40 lbs',93, now()-interval '1 day'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000013',
 'The moment you stop blaming your circumstances and own your choices completely is the exact moment your life actually starts to change. That moment is always available to you.',
 'general',null,82, now()-interval '1 day'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000015',
 'Long run done. 18 miles at 6:42 pace this morning. Boston Marathon prep is in full swing. Who else is training for a race right now? Let''s connect.',
 'general',null,47, now()-interval '1 day'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000007',
 'Two months of zero social media before noon. My focus has genuinely tripled. My anxiety dropped. My mornings belong to me now. The phone can wait.',
 'general',null,66, now()-interval '2 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000018',
 'Every single woman in my 6am group showed up today — in the rain. That is what real commitment looks like. I am honored to be your coach every single day.',
 'general',null,54, now()-interval '2 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000003',
 'First 5K under 30 minutes!! Six weeks ago I could not run a single mile without stopping. Progress is real. Do not let anyone tell you it is not possible.',
 'achievement','First sub-30 5K',71, now()-interval '2 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000008',
 'Reminder: you do not need a perfect diet. You need a sustainable one. Stop chasing perfection and start building consistency. Small wins every day compound into massive results.',
 'general',null,88, now()-interval '3 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000010',
 'Summit number 8 of the year! Rocky Mountain National Park at 5am hits completely different. Nature resets everything. Go outside this weekend — your mind needs it.',
 'achievement','8 summits this year',43, now()-interval '3 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000016',
 'Sunday meal prep complete! 5 healthy lunches and dinners ready for the week. Takes 2 hours on Sunday and saves 10 hours of bad decisions during the week.',
 'general',null,52, now()-interval '4 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000005',
 'Running a free 30-minute fitness assessment this Saturday for anyone in the Miami area. No sales pitch, no gimmicks — just honest feedback and a real game plan.',
 'meetup',null,38, now()-interval '4 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000012',
 'Got rejected by my 12th investor today. Celebrated with a solo dinner and a great bottle of wine. Rejection is just redirection. The 13th conversation is next week.',
 'general',null,79, now()-interval '5 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000009',
 'Saved my first $500 this month from my side hustle. Small number to some, a massive mindset shift for me. Financial freedom starts with one decision repeated daily.',
 'achievement','First $500 saved from side hustle',44, now()-interval '5 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000020',
 'Performed my first salsa solo at a community event last night. Six months ago I was too scared to even try a beginner class. Move through fear — it is the only way.',
 'achievement','First solo performance',67, now()-interval '6 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000022',
 'Friendly reminder to check on your strong friends today. Mental health does not always look like struggle from the outside. Ask how they are really doing.',
 'general',null,95, now()-interval '6 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000019',
 'Week 6 of biking to work instead of driving. Zero emissions commute, lost 8 lbs, and I genuinely look forward to Mondays now. Small changes, real impact.',
 'achievement','6 weeks car-free commuting',36, now()-interval '7 days'),

(gen_random_uuid(),'10000000-0000-0000-0000-000000000014',
 'Hosting a gentle yoga and breathwork session this Sunday morning in Phoenix — Encanto Park, 7am. Free and open to all levels. Bring a mat and a friend.',
 'meetup',null,29, now()-interval '7 days');


-- ── STEP 6: Connections ─────────────────────────────────────
-- Demo user (001) has accepted connections with 6 users
INSERT INTO connections (requester_id, receiver_id, status, created_at)
VALUES
('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','accepted',now()-interval '45 days'),
('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','accepted',now()-interval '38 days'),
('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000007','accepted',now()-interval '30 days'),
('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','accepted',now()-interval '22 days'),
('10000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','accepted',now()-interval '18 days'),
('10000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000001','accepted',now()-interval '10 days'),

-- Demo coach (002) has accepted connections with 4 users
('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','accepted',now()-interval '60 days'),
('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000008','accepted',now()-interval '50 days'),
('10000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000002','accepted',now()-interval '40 days'),
('10000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000002','accepted',now()-interval '25 days'),

-- 3 pending sparks sent TO demo user (shows up in paywall section)
('10000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','pending',now()-interval '2 days'),
('10000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000001','pending',now()-interval '1 day'),
('10000000-0000-0000-0000-000000000016','10000000-0000-0000-0000-000000000001','pending',now()-interval '3 hours')

ON CONFLICT DO NOTHING;
