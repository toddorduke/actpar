-- Community Events
create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  location text,
  event_date timestamptz not null,
  price numeric(10,2) not null default 0,
  stripe_payment_link text,
  max_attendees int,
  created_at timestamptz not null default now()
);
alter table community_events enable row level security;
create policy "members can view events" on community_events for select to authenticated using (true);
create policy "members can create events" on community_events for insert to authenticated with check (created_by = auth.uid());
create policy "creator can delete events" on community_events for delete to authenticated using (created_by = auth.uid());

-- Event RSVPs
create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references community_events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('going', 'maybe', 'not_going')),
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);
alter table event_rsvps enable row level security;
create policy "users can manage their rsvps" on event_rsvps for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "anyone can view rsvps" on event_rsvps for select to authenticated using (true);

-- Premium + Stripe columns on profiles
alter table profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists stripe_customer_id text;

-- Reports table (used by ReportModal)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  post_id uuid,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table reports enable row level security;
create policy "users can insert reports" on reports for insert to authenticated with check (reporter_id = auth.uid());
