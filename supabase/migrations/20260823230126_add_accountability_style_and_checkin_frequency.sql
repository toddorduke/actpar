-- Accountability-style matching: mismatched check-in tone/frequency is a
-- common reason accountability partnerships fail, so Sparks matching now
-- scores on these alongside shared looking_for tags, city, and goal overlap.
alter table profiles
  add column if not exists accountability_style text,
  add column if not exists checkin_frequency text;
