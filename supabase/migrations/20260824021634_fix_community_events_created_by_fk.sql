-- community_events.created_by had a foreign key to auth.users(id) instead
-- of profiles(id) -- same shape as the community_memberships bug fixed in
-- 20260822_fix_community_memberships_members_tab.sql. useCommunityEvents'
-- `.select('*, profiles(first_name, last_name), ...')` embed always
-- failed 400 (PostgREST can only resolve an embed via an FK pointing at
-- the embedded table itself), silently on the Events tab since nothing
-- checked the error, until a second caller surfaced it as a visible
-- console error. Repointing at profiles(id), mirroring the same
-- convention. Verified zero orphaned rows in profiles before adding.
alter table community_events
  drop constraint community_events_created_by_fkey;

alter table community_events
  add constraint community_events_created_by_fkey
  foreign key (created_by) references profiles(id) on delete set null;
