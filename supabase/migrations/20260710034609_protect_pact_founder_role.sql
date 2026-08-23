-- pact_members_update allows founder OR co-lead to change any member's role,
-- with no with_check restricting the target. The client only ever shows
-- management buttons to the founder and hides the founder's own row, but
-- nothing stopped a co-lead from calling the API directly to demote the
-- founder. Restrictive policy: a row currently marked founder can never be
-- updated by this policy, regardless of who is asking.
create policy "protect_founder_role_update" on pact_members
as restrictive
for update
to authenticated
using (role != 'founder');
