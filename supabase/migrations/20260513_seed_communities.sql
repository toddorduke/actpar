-- Allow system-seeded communities to have no creator
alter table communities alter column created_by drop not null;

-- Seed starter communities
insert into communities (name, description, created_by) values
  ('💪 Fitness & Health',        'Daily workouts, accountability, and healthy habits. Show up, log it, repeat.',                                      null),
  ('✝️ Faith & Spirituality',    'A space to grow in faith, share devotionals, and hold each other accountable in your walk.',                        null),
  ('🌱 Sobriety & Recovery',     'One day at a time. A judgment-free zone to share your journey and support others in recovery.',                      null),
  ('🧠 Mental Health',           'Normalize the conversation. Share struggles, wins, and resources for mental wellness.',                              null),
  ('💰 Finance & Wealth',        'Budgeting, investing, debt payoff, and building generational wealth — together.',                                    null),
  ('🥗 Nutrition & Clean Eating','Meal prep, macros, clean eating habits, and fueling your body right.',                                              null),
  ('🧘 Mindfulness & Meditation','Breathe, reflect, and reset. Daily mindfulness practices and meditation check-ins.',                                 null),
  ('📚 Reading & Learning',      'Book clubs, learning goals, and the habit of always growing your mind.',                                            null),
  ('💼 Career & Business',       'Entrepreneurs, professionals, and side hustlers building something great.',                                          null),
  ('❤️ Relationships & Family',  'Showing up for the people who matter most. Accountability for the relationships you want to build.',                null),
  ('😴 Sleep & Recovery',        'Better sleep = better everything. Track your rest and share what is working.',                                       null),
  ('🎯 Goal Setters',            'For anyone serious about setting goals and actually following through. All categories welcome.',                      null)
on conflict do nothing;
