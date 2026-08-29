-- Lets users request a coaching specialty they don't see on the
-- marketplace, giving real demand signal for which specialties to
-- recruit coaches for. Mirrors coach_applications' insert-own/select-own
-- RLS pattern.
create table coach_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  specialty text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table coach_requests enable row level security;

create policy coach_req_insert on coach_requests
  for insert with check (user_id = auth.uid());

create policy coach_req_select on coach_requests
  for select using (user_id = auth.uid());
