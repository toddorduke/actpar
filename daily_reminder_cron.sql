-- BEFORE RUNNING THIS:
-- 1. Go to Supabase Dashboard → Database → Extensions
-- 2. Enable "pg_cron" (search for it, toggle on)
-- 3. Enable "pg_net" if not already enabled
-- Then come back and run the statements below one at a time.

-- Step 1: Schedule the function to run at the top of every hour.
-- If you need to re-run this script, call cron.unschedule first (Step 0).

-- Step 0 (only if re-scheduling): remove old schedule
-- SELECT cron.unschedule('daily-reminder-hourly');

-- Step 1: Create the hourly schedule
SELECT cron.schedule(
  'daily-reminder-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url        := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-reminder',
    headers    := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body       := '{}'::jsonb
  )
  $$
);

-- Step 2: Verify it was created
-- SELECT * FROM cron.job WHERE jobname = 'daily-reminder-hourly';
