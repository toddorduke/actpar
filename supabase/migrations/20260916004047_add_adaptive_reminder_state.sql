-- Tracks how many of today's (up to 3) adaptive check-in reminders have
-- fired for a user, so the hourly cron knows whether this hour is their
-- next slot, and can stop early once everything's checked in for the day.
alter table profiles
  add column reminder_count_today integer not null default 0,
  add column reminder_count_date date;
