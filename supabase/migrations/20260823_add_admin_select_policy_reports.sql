-- reports had no admin SELECT policy at all -- only "view your own reports"
-- (reporter_id = auth.uid()). The admin queue in AdminPage.jsx has likely
-- been showing nothing but reports the admin personally filed. Mirrors the
-- existing "admin can view all issue reports" policy on issue_reports.
-- Found while verifying the governance_fixes migration's new "reports"
-- UPDATE policy via a simulated-admin RLS test.
create policy "admin can view all reports"
  on reports
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'toddwork1995@gmail.com');
