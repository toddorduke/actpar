// Real consecutive-day streak with 1 forgiven miss per calendar week (a
// "grace day"). goals.day_count only ever incremented before this and was
// mislabeled as a "streak" everywhere in the UI -- these functions are the
// single source of truth for both writing (checkIn) and displaying it.

const DAY_MS = 86400000;

function toDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function diffDays(aStr, bStr) {
  return Math.round((toDateOnly(aStr) - toDateOnly(bStr)) / DAY_MS);
}

// Monday (ISO week start) of the week containing dateStr, as 'YYYY-MM-DD'.
export function mondayOf(dateStr) {
  const d = toDateOnly(dateStr);
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().split('T')[0];
}

// Called from checkIn() at write time. Returns the new day_count and
// whether this check-in consumed the week's grace day.
export function computeCheckInStreak(goal, todayStr) {
  const prior = goal.day_count ?? 0;
  if (!goal.last_checked_in) {
    return { newCount: 1, graceUsedWeek: goal.grace_used_week ?? null, graceConsumed: false };
  }
  const gap = diffDays(todayStr, goal.last_checked_in);
  if (gap === 1) {
    return { newCount: prior + 1, graceUsedWeek: goal.grace_used_week ?? null, graceConsumed: false };
  }
  const thisWeek = mondayOf(todayStr);
  if (gap === 2 && goal.grace_used_week !== thisWeek) {
    return { newCount: prior + 1, graceUsedWeek: thisWeek, graceConsumed: true };
  }
  return { newCount: 1, graceUsedWeek: goal.grace_used_week ?? null, graceConsumed: false };
}

// Called at display/read time, for goals that haven't been touched today --
// day_count only updates on the next check-in, so a streak that's already
// effectively broken (or about to be, with no grace left) should read as 0
// rather than showing a stale number that no longer reflects reality.
export function getLiveStreak(goal, todayStr) {
  if (!goal.last_checked_in) return goal.day_count ?? 0;
  if (goal.last_checked_in === todayStr) return goal.day_count ?? 0;
  const gap = diffDays(todayStr, goal.last_checked_in);
  if (gap <= 1) return goal.day_count ?? 0; // still today's window to check in
  const thisWeek = mondayOf(todayStr);
  if (gap === 2 && goal.grace_used_week !== thisWeek) return goal.day_count ?? 0; // grace still covers it
  return 0; // streak has lapsed; next check-in will restart it at 1
}
