-- ── Meetup RSVP table ─────────────────────────────────────────────────────────
create table if not exists tribe_post_rsvps (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references tribe_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  status     text not null check (status in ('going', 'not_going')),
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- RLS
alter table tribe_post_rsvps enable row level security;

-- Anyone logged in can read RSVPs (to show counts/attendees)
create policy "rsvps_select" on tribe_post_rsvps
  for select using (auth.uid() is not null);

-- Users can insert their own RSVP
create policy "rsvps_insert" on tribe_post_rsvps
  for insert with check (auth.uid() = user_id);

-- Users can update their own RSVP
create policy "rsvps_update" on tribe_post_rsvps
  for update using (auth.uid() = user_id);

-- Users can delete their own RSVP
create policy "rsvps_delete" on tribe_post_rsvps
  for delete using (auth.uid() = user_id);
