-- challenge_entries.user_id pointed at auth.users(id) instead of
-- profiles(id), so PostgREST could never resolve the profiles(...) embed
-- used by useCommunityChallenges.js to show who logged each entry. Every
-- read/create/log call on the Challenges tab silently failed (empty list
-- on load, "Failed to create challenge" on submit) -- confirmed via SQL
-- that both community_challenges and challenge_entries had zero rows,
-- so this had never worked for a single user since it was built. Same
-- bug shape as the earlier community_events.created_by fix.
alter table challenge_entries drop constraint challenge_entries_user_id_fkey;
alter table challenge_entries
  add constraint challenge_entries_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;
