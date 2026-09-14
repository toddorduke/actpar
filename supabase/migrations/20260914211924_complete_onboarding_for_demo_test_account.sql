-- demo@goaltracker.app (the documented demo login in seed.sql) had never
-- completed onboarding, so ProtectedRoute permanently redirected it to
-- /onboarding -- meaning the app's own demo account couldn't actually be
-- used to log in and see the app. Found while live-testing the push
-- notification flow. profiles.onboarding_complete and
-- auth.users.user_metadata.onboarding_complete are two separate flags;
-- ProtectedRoute only checks the latter.
update profiles set onboarding_complete = true
where id = '10000000-0000-0000-0000-000000000001';

update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"onboarding_complete": true, "profile_setup_complete": true}'::jsonb
where id = '10000000-0000-0000-0000-000000000001';
