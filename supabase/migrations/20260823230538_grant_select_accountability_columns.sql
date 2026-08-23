-- 20260709215530_restrict_profiles_sensitive_columns.sql replaced the
-- table-wide SELECT grant on profiles with an explicit column list --
-- Postgres column-level grants don't auto-extend to new columns, so
-- accountability_style/checkin_frequency (added in
-- 20260823230126_add_accountability_style_and_checkin_frequency.sql) had
-- UPDATE but no SELECT privilege, which fails the whole PATCH .../profiles
-- request in PostgREST (update+select is one round trip) with a 403.
grant select (accountability_style, checkin_frequency) on profiles to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
