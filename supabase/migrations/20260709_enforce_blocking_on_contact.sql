-- Blocking was purely client-side UI filtering (useBlock.js only hides
-- profiles locally) — nothing at the DB level stopped a blocked user from
-- still inserting a connection request or direct message to whoever blocked
-- them. Restrictive policies are ANDed with the existing permissive insert
-- policies, so this closes the gap without touching them.
create policy "block_prevents_connection_insert" on connections
as restrictive
for insert
to authenticated
with check (
  not exists (
    select 1 from blocked_users b
    where (b.blocker_id = requester_id and b.blocked_id = receiver_id)
       or (b.blocker_id = receiver_id and b.blocked_id = requester_id)
  )
);

create policy "block_prevents_message_insert" on direct_messages
as restrictive
for insert
to authenticated
with check (
  not exists (
    select 1 from blocked_users b
    where (b.blocker_id = sender_id and b.blocked_id = receiver_id)
       or (b.blocker_id = receiver_id and b.blocked_id = sender_id)
  )
);
