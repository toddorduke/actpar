-- The upload flow already lets people mark media "My Sparks" (visibility
-- = 'connections'), but no RLS policy ever granted a connection access to
-- it -- the only non-owner SELECT policy was visibility = 'everyone', so
-- that content was invisible to everyone including accepted connections,
-- identical to a stranger's view. Same asymmetry as Facebook/Instagram's
-- "Friends" tier, just never wired up.
create policy media_select_connections on media
  for select using (
    visibility = 'connections'
    and exists (
      select 1 from connections
      where status = 'accepted'
        and (
          (requester_id = auth.uid() and receiver_id = media.user_id)
          or (requester_id = media.user_id and receiver_id = auth.uid())
        )
    )
  );
