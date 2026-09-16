import { getSupabaseClient } from '../lib/supabaseClient.js';

// Only createNotification is shared -- the full fetch+realtime hook has
// genuine per-platform differences (web plays sounds via the Audio API;
// mobile's realtime subscription needs an explicit
// supabase.realtime.setAuth(accessToken) before it delivers events, a
// requirement web's doesn't hit the same way), so each app keeps its own
// useNotifications hook. This helper is pure and identical everywhere.
//
// actorId = null means a system/milestone notification (always fires, even
// for self). actorId = a real user id blocks self-notifications (don't
// notify yourself for social actions).
export async function createNotification({ userId, actorId, type, refId, body }) {
  if (!userId) return;
  if (actorId && userId === actorId) return;
  await getSupabaseClient().from('notifications').insert({
    user_id: userId,
    actor_id: actorId ?? null,
    type,
    ref_id: refId ?? null,
    body,
  });
}
