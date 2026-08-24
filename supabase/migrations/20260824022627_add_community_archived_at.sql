-- Soft-delete for communities, matching the goals.is_active convention --
-- an admin "deleting" a community archives it (hides it from discovery/
-- membership lists) rather than a hard delete that would cascade-destroy
-- every post, event, and membership history in it.
alter table communities add column if not exists archived_at timestamptz;
