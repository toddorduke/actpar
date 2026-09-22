// @actpar/shared -- business logic shared between client/ (web) and
// mobile/ (React Native). UI stays separate per platform; this is the
// "brains" layer: data fetching, mutations, matching/streak rules,
// content moderation. Call setSupabaseClient() once at each app's entry
// point before rendering -- see lib/supabaseClient.js.
//
// Deliberately NOT shared here (genuine per-platform divergence, not just
// duplication -- see each hook's own file for why):
//   - useGoals: web does XP/analytics/milestone-broadcast-to-connections;
//     mobile has pause/resume/archive/extend/edit lifecycle web doesn't.
//   - useNotifications: web plays sounds via the Audio API; mobile's
//     realtime subscription needs an explicit setAuth() call web doesn't.
//     (createNotification() itself *is* shared -- see hooks/useNotifications.js)

export { setSupabaseClient, getSupabaseClient } from './lib/supabaseClient.js';
export { computeCheckInStreak, getLiveStreak, mondayOf } from './lib/streak.js';
export { getDisplayName } from './lib/displayName.js';
export { timeAgo, timeAgoShort, formatEventDate, formatDate } from './lib/dateUtils.js';
export { checkText, checkUsername } from './lib/contentModeration.js';
export { XP_VALUES, milestoneXP, awardXP } from './lib/xp.js';

export { useProfile } from './hooks/useProfile.js';
export { useConnections } from './hooks/useConnections.js';
export { useTribePosts } from './hooks/useTribePosts.js';
export { usePostLikes } from './hooks/usePostLikes.js';
export { usePostComments } from './hooks/usePostComments.js';
export { useMeetupRsvp } from './hooks/useMeetupRsvp.js';
export { usePact } from './hooks/usePact.js';
export { useGoalProgress } from './hooks/useGoalProgress.js';
export { useGoalMetrics } from './hooks/useGoalMetrics.js';
export { createNotification } from './hooks/useNotifications.js';
