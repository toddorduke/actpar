-- No UPDATE policy existed on community_memberships at all, so the
-- Make Admin / Remove Admin buttons in the Members tab silently failed
-- (RLS denies by default with no matching policy) while the client
-- optimistically flipped local state without checking the error.
create policy "admins can update member roles" on community_memberships
for update
to authenticated
using (
  exists (
    select 1 from community_memberships cm
    where cm.community_id = community_memberships.community_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
)
with check (
  exists (
    select 1 from community_memberships cm
    where cm.community_id = community_memberships.community_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

-- Neither the existing admin-remove DELETE policy nor the new UPDATE
-- policy protected the original community creator from being demoted or
-- kicked by another admin. These restrictive policies close that gap
-- while still letting the creator voluntarily leave their own community.
create policy "protect_creator_membership_delete" on community_memberships
as restrictive
for delete
to authenticated
using (
  user_id != (select created_by from communities where id = community_memberships.community_id)
  or user_id = auth.uid()
);

create policy "protect_creator_membership_update" on community_memberships
as restrictive
for update
to authenticated
using (
  user_id != (select created_by from communities where id = community_memberships.community_id)
);
