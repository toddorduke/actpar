-- The previous migration's REVOKE ... FROM anon didn't actually close the
-- hole: these functions still had EXECUTE granted to PUBLIC (Postgres's
-- default grant on function creation), which every role -- including anon
-- -- inherits regardless of a role-specific REVOKE. Confirmed live: a real
-- anon-key RPC call to add_xp still returned 204 after the anon-only
-- revoke. Revoking from PUBLIC is what actually removes it for anon.
--
-- Note for anyone reading information_schema.routine_privileges to audit
-- this later: a plain `JOIN pg_roles` on the grantee column silently drops
-- PUBLIC rows, since PUBLIC isn't a real row in pg_roles -- that's exactly
-- what masked this the first time. Query routine_privileges directly.
REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_custom_category(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_archive_paused_goals_v2() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batch_notifications() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_goal_cap_v2() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM PUBLIC;

-- Re-grant EXECUTE to authenticated explicitly on add_xp/increment_custom_category
-- (revoking FROM PUBLIC removes it for every role that was only relying on
-- the PUBLIC grant -- authenticated had its own explicit grant already from
-- the original CREATE FUNCTION, but making it explicit here removes any
-- doubt and matches how these two are actually meant to be called: by a
-- signed-in user, about themselves).
GRANT EXECUTE ON FUNCTION public.add_xp(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_custom_category(text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
