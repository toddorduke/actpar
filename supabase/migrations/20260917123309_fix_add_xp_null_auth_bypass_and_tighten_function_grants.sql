-- add_xp and increment_custom_category both guard against a caller
-- targeting someone else's row with `if uid <> auth.uid() then return; end if;`
-- (or p_user_id <> auth.uid()). That comparison is NULL, not TRUE, when
-- auth.uid() is NULL -- i.e. for an unauthenticated `anon` caller -- and
-- plpgsql treats a NULL IF-condition as false, so the guard clause is
-- silently skipped and the function runs anyway. Concretely: anyone,
-- logged in or not, could call
--   POST /rest/v1/rpc/add_xp  { "uid": "<any real user id>", "xp_amount": 999999 }
-- and it would succeed, because the guard never actually fired for an
-- anonymous request. This is a different gap than the one
-- 20260823151518_fix_like_count_and_xp_authorization.sql closed (that one
-- stopped a *different signed-in user* from targeting someone else; it
-- never considered the anon/null-auth.uid() case). Fix: reject a null
-- auth.uid() explicitly, and revoke anon's EXECUTE grant as defense in depth.

CREATE OR REPLACE FUNCTION public.add_xp(uid uuid, xp_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or uid <> auth.uid() then
    return;
  end if;
  update profiles set total_xp = coalesce(total_xp, 0) + xp_amount where id = uid;
end;
$function$;

CREATE OR REPLACE FUNCTION public.increment_custom_category(cat_name text, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare rec record;
begin
  if auth.uid() is null or p_user_id <> auth.uid() then
    return;
  end if;

  select id, use_count, status into rec
  from custom_categories
  where lower(name) = lower(cat_name) and status != 'archived'
  limit 1;

  if rec.id is null then
    insert into custom_categories (name, use_count, status, created_by, last_used_at)
    values (cat_name, 1, 'pending', p_user_id, now());
  else
    update custom_categories set
      use_count    = rec.use_count + 1,
      last_used_at = now(),
      status       = case when rec.use_count + 1 >= 3 and rec.status = 'pending'
                     then 'active' else rec.status end
    where id = rec.id;
  end if;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_custom_category(text, uuid) FROM anon;

-- delete_user_account / claim_push_subscription are both incidentally
-- null-safe already (their WHERE/VALUES clauses key off auth.uid()
-- directly, so a null auth.uid() just matches/inserts nothing) but have no
-- legitimate anon use case -- revoke as hygiene, not because of an active bug.
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_push_subscription(text, text, text) FROM anon;

-- These five are trigger/cron-invoked only (confirmed via
-- information_schema.triggers and cron.job, and confirmed no client code
-- calls them via supabase.rpc(...)) -- trigger and cron invocation doesn't
-- require the firing role to hold EXECUTE on the function, so revoking from
-- both anon and authenticated closes the direct-RPC surface without
-- touching their real invocation path.
REVOKE EXECUTE ON FUNCTION public.auto_archive_paused_goals_v2() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.batch_notifications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_goal_cap_v2() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM anon, authenticated;
