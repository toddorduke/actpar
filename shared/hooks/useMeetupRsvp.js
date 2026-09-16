import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient.js';

/**
 * Fetches RSVP data for a list of meetup post IDs.
 * Returns going counts per post and the current user's RSVP status per post.
 */
export function useMeetupRsvp(userId, meetupPostIds) {
  const [goingCounts, setGoingCounts] = useState({});
  const [myRsvps, setMyRsvps] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meetupPostIds.length) return;

    async function fetch() {
      setLoading(true);
      const { data } = await getSupabaseClient()
        .from('tribe_post_rsvps')
        .select('post_id, user_id, status')
        .in('post_id', meetupPostIds);

      if (data) {
        const counts = {};
        const mine = {};
        for (const r of data) {
          if (r.status === 'going') counts[r.post_id] = (counts[r.post_id] ?? 0) + 1;
          if (userId && r.user_id === userId) mine[r.post_id] = r.status;
        }
        setGoingCounts(counts);
        setMyRsvps(mine);
      }
      setLoading(false);
    }

    fetch();
  }, [meetupPostIds.join(','), userId]);

  const toggleRsvp = useCallback(async (postId, status) => {
    if (!userId) return { error: null };
    const supabase = getSupabaseClient();
    const current = myRsvps[postId] ?? null;

    if (current === status) {
      // Remove RSVP (toggle off)
      setMyRsvps((prev) => { const n = { ...prev }; delete n[postId]; return n; });
      if (status === 'going') setGoingCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 1) - 1) }));
      const { error } = await supabase.from('tribe_post_rsvps').delete().eq('post_id', postId).eq('user_id', userId);
      if (error) {
        setMyRsvps((prev) => ({ ...prev, [postId]: current }));
        if (status === 'going') setGoingCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
      }
      return { error };
    } else {
      const wasGoing = current === 'going';
      const nowGoing = status === 'going';
      setMyRsvps((prev) => ({ ...prev, [postId]: status }));
      setGoingCounts((prev) => {
        let c = prev[postId] ?? 0;
        if (wasGoing) c -= 1;
        if (nowGoing) c += 1;
        return { ...prev, [postId]: Math.max(0, c) };
      });
      const { error } = await supabase.from('tribe_post_rsvps').upsert(
        { post_id: postId, user_id: userId, status },
        { onConflict: 'post_id,user_id' }
      );
      if (error) {
        setMyRsvps((prev) => { const n = { ...prev }; if (current) n[postId] = current; else delete n[postId]; return n; });
        setGoingCounts((prev) => {
          let c = prev[postId] ?? 0;
          if (wasGoing) c += 1;
          if (nowGoing) c -= 1;
          return { ...prev, [postId]: Math.max(0, c) };
        });
      }
      return { error };
    }
  }, [userId, myRsvps]);

  return { goingCounts, myRsvps, loading, toggleRsvp };
}
