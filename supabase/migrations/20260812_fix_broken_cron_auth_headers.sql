-- goal-reminders-hourly and weekly-digest-sunday read their auth token from
-- the Postgres setting app.service_role_key, which was never actually set
-- (current_setting('app.service_role_key', true) returned null) -- both
-- jobs have been sending "Bearer " with no token on every run. Switching to
-- the same hardcoded-header pattern already used by journey-deadline-hourly
-- and daily-reminder-hourly.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'goal-reminders-hourly'),
  command := $cron$
  select net.http_post(
    url := 'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/send-goal-reminders',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $cron$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'weekly-digest-sunday'),
  command := $cron$
  select net.http_post(
    url := 'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/weekly-digest',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $cron$
);
