-- The "Meetup" post type collected no actual event details (date, time,
-- location) — it was indistinguishable from a plain text post other than
-- the badge. Adding real structured fields so meetup posts can carry when
-- and where, plus an optional community tag so a meetup posted from a
-- personal/global feed (Home, Explore, My Community — none of which have
-- a community in scope) can still be associated with one of the user's
-- communities. tribe_posts already has a nullable community_id column
-- used by CommunityPage's own feed; reusing it here rather than adding a
-- new one.
alter table tribe_posts
  add column if not exists event_date timestamptz,
  add column if not exists location text;
