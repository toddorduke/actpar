-- The restrictive block-enforcement policies added in
-- 20260709_enforce_blocking_on_contact.sql never actually worked: their
-- `with_check` subqueries against blocked_users run under the *inserting*
-- user's own privileges, and blocked_users' SELECT policy ("users can view
-- own blocks") only lets the blocker see rows they created. So when a
-- blocked user tries to message/connect with whoever blocked them, the
-- policy's own lookup can't see the block row and silently allows it.
--
-- Fix: move the lookup into a SECURITY DEFINER function (owned by postgres,
-- which bypasses RLS) so the block is visible regardless of which side of
-- it is making the request.
create or replace function public.is_blocked_between(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from blocked_users b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  );
$$;

revoke all on function public.is_blocked_between(uuid, uuid) from public;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

drop policy if exists "block_prevents_connection_insert" on connections;
create policy "block_prevents_connection_insert" on connections
as restrictive
for insert
to authenticated
with check (
  not public.is_blocked_between(requester_id, receiver_id)
);

drop policy if exists "block_prevents_message_insert" on direct_messages;
create policy "block_prevents_message_insert" on direct_messages
as restrictive
for insert
to authenticated
with check (
  not public.is_blocked_between(sender_id, receiver_id)
);
