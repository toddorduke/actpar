-- goals.day_count only ever incremented and never reset -- effectively a
-- lifetime check-in counter mislabeled as a "streak" everywhere in the UI
-- (reminder copy even says "don't break it!" while nothing could). Real
-- consecutive-day tracking now lives in client/src/utils/streak.js, with
-- one forgiven miss per calendar week tracked here.
alter table goals add column if not exists grace_used_week date;
