-- coach_requests had no status column and no admin read/write policy at
-- all -- only the requester themself could ever SELECT their own row, so
-- "Request a Coach" wrote into a table nobody, including the app's own
-- admin, could see or act on. Bringing it in line with the existing
-- reports/issue_reports admin-review pattern.
alter table coach_requests
  add column status text not null default 'pending'
  check (status in ('pending', 'contacted', 'dismissed'));

create policy "admin can view all coach requests" on coach_requests
  for select using ((auth.jwt() ->> 'email') = 'toddwork1995@gmail.com');

create policy "admin can update coach requests" on coach_requests
  for update using ((auth.jwt() ->> 'email') = 'toddwork1995@gmail.com');
