-- 1. Account deletion can fail outright: profiles.referred_by has no ON DELETE
-- action, so deleting a user who referred someone still on the platform hits
-- an FK violation and the whole delete_user_account() transaction rolls back.
-- SET NULL preserves the referred user's row and just drops the now-dangling
-- referral link.
alter table profiles
  drop constraint profiles_referred_by_fkey;
alter table profiles
  add constraint profiles_referred_by_fkey
  foreign key (referred_by) references profiles(id) on delete set null;

-- 2. reports has no UPDATE policy at all -- AdminPage's "mark report as
-- reviewed/resolved" silently fails via RLS for everyone, including the
-- admin. Mirrors the existing admin-gated pattern already used on
-- issue_reports.
create policy "admin can update reports"
  on reports
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'toddwork1995@gmail.com');

-- 3. No record of admin actions (ban, report/issue status changes) -- who
-- did what, when. Insert/select both gated to the same hardcoded admin
-- email already used elsewhere; the ban-user edge function uses
-- service_role and bypasses RLS to insert on the admin's behalf.
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table admin_audit_log enable row level security;

create policy "admin can insert audit log"
  on admin_audit_log
  for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'toddwork1995@gmail.com' and admin_id = auth.uid());

create policy "admin can view audit log"
  on admin_audit_log
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'toddwork1995@gmail.com');
