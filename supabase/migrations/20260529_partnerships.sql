-- Accountability journey partnerships between two users
create table if not exists partnerships (
  id          uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  receiver_id  uuid not null references profiles(id) on delete cascade,
  goal_id_1    uuid references goals(id) on delete set null,  -- requester's goal
  goal_id_2    uuid references goals(id) on delete set null,  -- receiver's goal
  status       text not null default 'pending'
                 check (status in ('pending', 'active', 'ended')),
  started_at   timestamptz,
  created_at   timestamptz default now(),
  constraint no_self_partnership check (requester_id != receiver_id)
);

alter table partnerships enable row level security;

create policy "Users can view own partnerships" on partnerships
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can propose partnerships" on partnerships
  for insert with check (auth.uid() = requester_id);

create policy "Users can update partnerships they belong to" on partnerships
  for update using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can delete partnerships they belong to" on partnerships
  for delete using (auth.uid() = requester_id or auth.uid() = receiver_id);
