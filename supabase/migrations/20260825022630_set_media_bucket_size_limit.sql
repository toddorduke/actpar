-- The media bucket had no file_size_limit set, so uploads silently fell
-- back to the Supabase project's global default (well below the 200MB
-- client-side promise in FeedPage.jsx's MAX_VIDEO check). Any video
-- between the project default and 200MB failed with Storage's raw
-- "The object exceeded the maximum allowed size" error on the Explore
-- page's video upload -- explicit bucket limit now matches what the
-- client actually tells users.
update storage.buckets set file_size_limit = 209715200 where id = 'media';

-- Same root cause, swept across every other bucket in the project:
-- issue-screenshots also had no explicit limit, relying on the same
-- global default. Its client-side check (validateFileSize in
-- contentModeration.js) promises up to 10MB for images -- set explicit
-- to match, closing the same gap before it ever produced a confusing
-- error for a real user.
update storage.buckets set file_size_limit = 10485760 where id = 'issue-screenshots';
