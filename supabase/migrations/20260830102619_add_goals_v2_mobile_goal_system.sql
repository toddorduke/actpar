-- New goal system for the mobile app, per the "ActPac Goal System Spec".
-- Deliberately named _v2 and kept separate from the existing `goals` table
-- (used by the web app's habit/numeric goal system, streak.js, and
-- community challenges/leaderboards) -- this is meant to eventually become
-- the shared model for both apps, but that migration is a separate,
-- dedicated pass. For now only the mobile app reads/writes these tables.

create table goals_v2 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  tag text not null,
  frequency text not null check (frequency in ('daily', '3x_week', 'weekly')),
  duration_days int check (duration_days in (30, 60, 90)), -- null = Ongoing
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  ends_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  change_count int not null default 0
);

create table goal_checkins_v2 (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals_v2(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (goal_id, date)
);

-- One row per completion/archive/pause event, with tag + duration, so
-- per-category success rates can be computed later (spec section 5) without
-- needing to reconstruct history from goals_v2's current-state columns.
create table goal_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals_v2(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  tag text not null,
  duration_days int,
  event text not null check (event in ('completed', 'archived', 'paused')),
  created_at timestamptz not null default now()
);

-- One row per edit, so the "3rd change within 30 days" nudge (spec
-- section 3) can be computed from a real time window instead of just a
-- lifetime counter.
create table goal_edits_v2 (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals_v2(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table goals_v2 enable row level security;
alter table goal_checkins_v2 enable row level security;
alter table goal_lifecycle_events enable row level security;
alter table goal_edits_v2 enable row level security;

create policy goals_v2_own on goals_v2
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_checkins_v2_own on goal_checkins_v2
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_lifecycle_events_own on goal_lifecycle_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_edits_v2_own on goal_edits_v2
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Server-side active-goal cap (spec section 1): Free = 2, Member Pro = 4.
-- Enforced here, not just in the client, so the cap holds even if the
-- mobile app's own check is bypassed or buggy.
create or replace function enforce_goal_cap_v2()
returns trigger as $$
declare
  active_count int;
  cap int;
  is_pro boolean;
begin
  if new.status <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  select coalesce(is_premium, false) into is_pro from profiles where id = new.user_id;
  cap := case when is_pro then 4 else 2 end;

  select count(*) into active_count
  from goals_v2
  where user_id = new.user_id
    and status = 'active'
    and id <> new.id;

  if active_count >= cap then
    raise exception 'ACTIVE_GOAL_CAP_REACHED' using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger goals_v2_cap_check
before insert or update on goals_v2
for each row execute function enforce_goal_cap_v2();

-- Auto-archive goals paused for 14+ days (spec section 3). Matches the
-- existing hourly-cron convention used by daily-reminder-hourly etc.
create or replace function auto_archive_paused_goals_v2()
returns void as $$
begin
  insert into goal_lifecycle_events (goal_id, user_id, tag, duration_days, event)
  select id, user_id, tag, duration_days, 'archived'
  from goals_v2
  where status = 'paused' and paused_at < now() - interval '14 days';

  update goals_v2
  set status = 'archived'
  where status = 'paused' and paused_at < now() - interval '14 days';
end;
$$ language plpgsql security definer set search_path = public;

select cron.schedule(
  'goal-v2-auto-archive-hourly',
  '0 * * * *',
  $$select auto_archive_paused_goals_v2();$$
);
