-- community_memberships.user_id had a foreign key, but to auth.users(id)
-- instead of profiles(id) -- so MembersTab's `.select('*, profiles(...)')`
-- embed in CommunityPage.jsx always failed (PostgREST can only resolve an
-- embed via an FK pointing at the embedded table itself), silently, since
-- the caller never checked the error. Every community's Members tab has
-- shown "0 members" since launch. Repointing at profiles(id), mirroring
-- the existing tribe_posts_user_id_fkey convention. Verified zero
-- orphaned rows in profiles before adding.
alter table community_memberships
  drop constraint community_memberships_user_id_fkey;

alter table community_memberships
  add constraint community_memberships_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;
