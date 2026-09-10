-- GoTrue's Go driver scans confirmation_token/recovery_token/email_change_token_new/
-- email_change as strings and crashes ("converting NULL to string is unsupported")
-- on any password-grant login for a user row where these are NULL instead of ''.
-- The seed.sql demo/fake accounts were inserted via raw SQL and never had these
-- columns set, unlike real signups (which GoTrue itself always sets to '').
-- Confirmed via auth_logs: only seed/demo rows (@demo.internal, @actpar.internal,
-- demo@goaltracker.app, coach@goaltracker.app) were affected -- no real user.
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change = coalesce(email_change, '')
where confirmation_token is null or recovery_token is null or email_change_token_new is null or email_change is null;
