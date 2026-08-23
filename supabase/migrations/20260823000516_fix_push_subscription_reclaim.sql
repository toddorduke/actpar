-- Browser push subscriptions are tied to the browser+device, not to
-- whichever ActPar account happens to be logged in — so the same endpoint
-- can resurface under a different user (switching accounts on the same
-- browser, e.g.). The client upserts on endpoint conflict, which becomes
-- an UPDATE against whatever row already owns that endpoint. RLS
-- correctly blocks that UPDATE when the existing row belongs to someone
-- else ("new row violates row-level security policy (USING expression)"),
-- since no ordinary policy should let one user overwrite another user's
-- row. The right behavior here is "the current browser/device now belongs
-- to me" — reassign it. Doing that via a SECURITY DEFINER function keeps
-- the reassignment scoped to exactly this one legitimate case instead of
-- loosening the table's RLS in general.
create or replace function public.claim_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from push_subscriptions where endpoint = p_endpoint and user_id <> auth.uid();
  insert into push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh, auth = excluded.auth, user_id = excluded.user_id;
end;
$$;

revoke all on function public.claim_push_subscription(text, text, text) from public;
grant execute on function public.claim_push_subscription(text, text, text) to authenticated;
