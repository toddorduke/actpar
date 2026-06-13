const MILESTONES = [7, 30, 60, 90];

function mondayOfThisWeek() {
  const now = new Date();
  const diff = (now.getDay() + 6) % 7; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekKey() {
  return `actpar_recap_${mondayOfThisWeek().toISOString().split('T')[0]}`;
}

function weekDateRange() {
  const monday = mondayOfThisWeek();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const monday = mondayOfThisWeek();
  const d = new Date(dateStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return d >= monday && d < sunday;
}

function nextMilestone(dayCount) {
  return MILESTONES.find((m) => m > dayCount) ?? null;
}

export function shouldShowRecap() {
  const day = new Date().getDay(); // 5=Fri, 6=Sat, 0=Sun
  if (day !== 5 && day !== 6 && day !== 0) return false;
  return !localStorage.getItem(weekKey());
}

export function dismissRecap(grade) {
  localStorage.setItem(weekKey(), '1');
  if (grade) localStorage.setItem('actpar_recap_prev_grade', grade);
}

export function getPrevGrade() {
  return localStorage.getItem('actpar_recap_prev_grade') ?? null;
}

export function computeRecap(goals, acceptedConnections, activity) {
  const habitGoals = goals.filter((g) => g.goal_type !== 'numeric');
  const activeThisWeek = habitGoals.filter((g) => isThisWeek(g.last_checked_in));
  const totalStreakDays = goals.reduce((sum, g) => sum + (g.day_count ?? 0), 0);
  const bestStreak = goals.reduce((best, g) => (!best || (g.day_count ?? 0) > (best.day_count ?? 0)) ? g : best, null);

  const goalsWithMilestone = habitGoals
    .map((g) => {
      const next = nextMilestone(g.day_count ?? 0);
      const daysLeft = next ? next - (g.day_count ?? 0) : null;
      return { ...g, nextMilestone: next, daysToMilestone: daysLeft };
    })
    .filter((g) => g.daysToMilestone !== null && g.daysToMilestone <= 7)
    .sort((a, b) => a.daysToMilestone - b.daysToMilestone);

  const connectionIds = new Set(
    acceptedConnections.map((c) => (c.requester_id === undefined ? c.receiver_id : c.requester_id))
  );
  const activeConnections = new Set(activity.map((a) => a.user_id)).size;

  const ratio = habitGoals.length > 0 ? activeThisWeek.length / habitGoals.length : 0;
  let grade, gradeColor, message;
  if (ratio >= 1) {
    grade = 'Flawless'; gradeColor = '#10b981';
    message = "Perfect week. Every single goal. That's discipline, not luck.";
  } else if (ratio >= 0.75) {
    grade = 'Strong'; gradeColor = '#7c3aed';
    message = 'Solid week. A few misses, but you showed up where it counts.';
  } else if (ratio >= 0.5) {
    grade = 'Decent'; gradeColor = '#f59e0b';
    message = "You got some reps in. Next week, let's push harder.";
  } else if (ratio > 0) {
    grade = 'Rough'; gradeColor = '#f97316';
    message = "Tough week — but you're still here. That's what matters. Reset and go.";
  } else {
    grade = 'Missed'; gradeColor = '#ef4444';
    message = "Nothing logged this week. No judgment — but next week starts fresh. Let's go.";
  }

  return {
    dateRange: weekDateRange(),
    habitGoals,
    activeThisWeek,
    totalStreakDays,
    bestStreak,
    goalsWithMilestone,
    activeConnections,
    grade,
    gradeColor,
    message,
  };
}
