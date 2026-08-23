-- Admin needs to see and update every issue report, not just their own
create policy "admin can view all issue reports" on issue_reports
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'toddwork1995@gmail.com');

create policy "admin can update issue reports" on issue_reports
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'toddwork1995@gmail.com');
