-- Fires the send-email function when a connection flips to accepted, so the
-- match email can go out (opt-in via profiles.notification_prefs.email_match).
--
-- NOTE: replace YOUR_SERVICE_ROLE_KEY below with the project's actual
-- service_role key before applying this migration to a fresh environment.
-- Never commit the real key here -- this file is public.
create trigger "on_connection_accepted"
after update on connections
for each row
when (new.status = 'accepted' and old.status is distinct from 'accepted')
execute function supabase_functions.http_request(
  'https://sssjsuqymavlhwjslyyn.supabase.co/functions/v1/send-email',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
  '{}',
  '5000'
);
