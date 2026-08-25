-- The previous migration set media's file_size_limit to 200MB to match what
-- the client promised, but empirical testing (uploading 45MB/55MB/90MB test
-- files) showed the project actually rejects anything over ~50MB with
-- EntityTooLarge, regardless of this bucket setting or the 200MB shown in
-- Storage Settings -> Global file size limit. That field appears to accept
-- a higher value than the project's plan tier actually enforces.
-- Lowering the bucket limit here to match the real, verified ceiling; the
-- client-side checks and error copy in HomePage.jsx, FeedPage.jsx, and
-- contentModeration.js were lowered to 50MB in the same change.
update storage.buckets set file_size_limit = 52428800 where id = 'media';
