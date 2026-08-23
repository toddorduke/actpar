-- The legacy service_role JWT leaked in git history (commit e3fe0aa,
-- 20260709_connection_match_email_trigger.sql) was hardcoded directly into
-- 4 DB triggers and 2 cron jobs. Confirmed live/exploitable on 2026-08-12
-- (full admin API access with the leaked string). Swapping all of them to
-- the new-format sb_secret_ key so the leaked legacy key is no longer used
-- anywhere in this DB, ahead of disabling legacy keys entirely.
drop trigger if exists "on_connection_accepted" on connections;
create trigger "on_connection_accepted"
after update on public.connections
for each row
when (((new.status = 'accepted'::text) AND (old.status IS DISTINCT FROM 'accepted'::text)))
execute function supabase_functions.http_request(
  'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/send-email',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}',
  '5000'
);

drop trigger if exists "on_spark_sent" on connections;
create trigger "on_spark_sent"
after insert on public.connections
for each row
execute function supabase_functions.http_request(
  'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/send-email',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}',
  '5000'
);

drop trigger if exists "on_message_sent" on direct_messages;
create trigger "on_message_sent"
after insert on public.direct_messages
for each row
execute function supabase_functions.http_request(
  'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/send-email',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}',
  '5000'
);

drop trigger if exists "send-push-on-notification" on notifications;
create trigger "send-push-on-notification"
after insert on public.notifications
for each row
execute function supabase_functions.http_request(
  'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/send-push',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}',
  '5000'
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'journey-deadline-hourly'),
  command := $cron$
  select net.http_post(
    url := 'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/journey-deadline',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $cron$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'daily-reminder-hourly'),
  command := $cron$
  select net.http_post(
    url      := 'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/daily-reminder',
    headers  := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body     := '{}'::jsonb
  ) as request_id;
  $cron$
);
