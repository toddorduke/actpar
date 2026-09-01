-- Extends goals_v2 to become the single shared goal model for both the
-- mobile app (ActPac Goal System Spec) and the web app's existing goal
-- system, then migrates the web app's real goals/checkin_logs/goal_progress
-- data onto it.

-- 1. Numeric/progress goal support -- the web app's Add Goal form still
-- offers "Progress Goal" (target value/unit/period) as a live feature,
-- which goals_v2 had no equivalent for. No existing goal actually uses
-- it yet, but the feature itself must keep working.
alter table goals_v2 add column goal_type text not null default 'habit' check (goal_type in ('habit', 'numeric'));
alter table goals_v2 add column target_value numeric;
alter table goals_v2 add column target_unit text;
alter table goals_v2 add column target_period text check (target_period in ('weekly', 'monthly', 'total'));
alter table goals_v2 alter column frequency drop not null;

alter table goals_v2 add constraint goals_v2_type_fields_check check (
  (goal_type = 'habit' and frequency is not null and target_value is null and target_unit is null and target_period is null)
  or
  (goal_type = 'numeric' and target_value is not null and target_unit is not null and target_period is not null)
);

-- 2. Streak aggregate fields, mirroring goals.day_count/last_checked_in/
-- grace_used_week exactly, so the existing grace-day streak engine
-- (client/src/utils/streak.js) can operate on goals_v2 rows with zero
-- changes to its own logic -- only what table it reads from changes.
alter table goals_v2 add column day_count int not null default 0;
alter table goals_v2 add column last_checked_in date;
alter table goals_v2 add column grace_used_week date;

-- 3. Other live web-app fields with no equivalent yet: the "why" field,
-- Goal Pyramid tier (1/2/3), per-goal reminder hour, and cached numeric
-- progress (used on public profiles, separate from goal_progress_v2's
-- own log of entries).
alter table goals_v2 add column description text;
alter table goals_v2 add column tier int default 3;
alter table goals_v2 add column reminder_utc_hour int;
alter table goals_v2 add column progress numeric default 0;
alter table goals_v2 add column updated_at timestamptz default now();

-- 4. RLS correction: the original goals_v2 policy was owner-only, but
-- community leaderboards (Goal Streaks section, Top Contributors sidebar)
-- need to read OTHER members' goals to rank them -- exactly how the
-- existing `goals` table already works ("goals are readable by
-- authenticated users"). goal_checkins_v2 stays owner-only, matching
-- checkin_logs' actual RLS -- only the day_count aggregate on the goal
-- row itself needs to be public, not the individual check-in events.
drop policy goals_v2_own on goals_v2;
create policy goals_v2_select on goals_v2 for select using (auth.role() = 'authenticated');
create policy goals_v2_insert on goals_v2 for insert with check (user_id = auth.uid());
create policy goals_v2_update on goals_v2 for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_v2_delete on goals_v2 for delete using (user_id = auth.uid());

-- 5. Progress log for numeric goals, mirroring goal_progress (including
-- its broad-read policy, used for pact/leaderboard visibility).
create table goal_progress_v2 (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals_v2(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value numeric not null,
  note text,
  logged_at timestamptz not null default now()
);
alter table goal_progress_v2 enable row level security;
create policy goal_progress_v2_insert on goal_progress_v2 for insert with check (user_id = auth.uid());
create policy goal_progress_v2_select on goal_progress_v2 for select using (auth.role() = 'authenticated');

-- 6. Migrate existing goals data. `category` values already exactly match
-- the new interest-tag taxonomy (fitness, career, finance, faith,
-- mental_health, ...), so it maps directly onto `tag`; goals with no
-- category default to 'custom'. Old habit goals had an implicit daily
-- check-in cadence, so frequency defaults to 'daily'. Every user is
-- currently free-tier (cap 2); users with more than their cap's worth
-- of active goals keep their most-recently-active ones as active and
-- the rest migrate as archived (per explicit direction: this is all
-- mock/seed data, so trimming rather than preserving over-cap active
-- status is fine -- nothing is deleted, just no longer marked active).
insert into goals_v2 (
  id, user_id, title, tag, frequency, duration_days, status, created_at,
  change_count, goal_type, target_value, target_unit, target_period,
  day_count, last_checked_in, grace_used_week,
  description, tier, reminder_utc_hour, progress, updated_at
)
select
  g.id, g.user_id, g.title,
  coalesce(g.category, 'custom') as tag,
  case when g.goal_type = 'numeric' then null else 'daily' end as frequency,
  null as duration_days,
  case
    when not g.is_active then 'archived'
    when row_number() over (
      partition by g.user_id
      order by g.last_checked_in desc nulls last, g.created_at desc
    ) <= case when coalesce(p.is_premium, false) then 4 else 2 end
    then 'active'
    else 'archived'
  end as status,
  g.created_at,
  0 as change_count,
  g.goal_type,
  g.target_value, g.target_unit, g.target_period,
  coalesce(g.day_count, 0), g.last_checked_in, g.grace_used_week,
  g.description, g.tier, g.reminder_utc_hour, coalesce(g.progress, 0), g.updated_at
from goals g
join profiles p on p.id = g.user_id
on conflict (id) do nothing;

insert into goal_checkins_v2 (goal_id, user_id, date, done, created_at)
select goal_id, user_id, checked_in_at::date, true, created_at
from checkin_logs
where goal_id in (select id from goals_v2)
on conflict (goal_id, date) do nothing;

insert into goal_progress_v2 (id, goal_id, user_id, value, note, logged_at)
select id, goal_id, user_id, value, note, logged_at
from goal_progress
where goal_id in (select id from goals_v2)
on conflict (id) do nothing;
