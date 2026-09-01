// Mirror of client/src/utils/streak.js -- real consecutive-day streak with
// 1 forgiven miss per calendar week (a "grace day"). Both web and mobile
// write/read the same goals_v2.day_count/last_checked_in/grace_used_week
// fields, so this logic must stay identical on both sides. If you change
// one, change the other.

const DAY_MS = 86400000;

function toDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function diffDays(aStr, bStr) {
  return Math.round((toDateOnly(aStr) - toDateOnly(bStr)) / DAY_MS);
}

export function mondayOf(dateStr) {
  const d = toDateOnly(dateStr);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().split('T')[0];
}

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

export function getLiveStreak(goal, todayStr) {
  if (!goal.last_checked_in) return goal.day_count ?? 0;
  if (goal.last_checked_in === todayStr) return goal.day_count ?? 0;
  const gap = diffDays(todayStr, goal.last_checked_in);
  if (gap <= 1) return goal.day_count ?? 0;
  const thisWeek = mondayOf(todayStr);
  if (gap === 2 && goal.grace_used_week !== thisWeek) return goal.day_count ?? 0;
  return 0;
}
