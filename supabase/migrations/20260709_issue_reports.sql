-- Issue / feedback reports (bugs, broken features, inconveniences)
create table if not exists issue_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  description text not null,
  screenshot_url text,
  page_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table issue_reports enable row level security;
create policy "users can insert issue reports" on issue_reports for insert to authenticated with check (user_id = auth.uid());
create policy "users can view own issue reports" on issue_reports for select to authenticated using (user_id = auth.uid());

-- Storage bucket for issue screenshots
insert into storage.buckets (id, name, public)
values ('issue-screenshots', 'issue-screenshots', true)
on conflict (id) do nothing;

create policy "authenticated users can upload issue screenshots"
on storage.objects for insert to authenticated
with check (bucket_id = 'issue-screenshots');

create policy "anyone can view issue screenshots"
on storage.objects for select
using (bucket_id = 'issue-screenshots');
