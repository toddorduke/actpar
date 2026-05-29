import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

/**
 * Fetches RSVP data for a list of meetup post IDs.
 * Returns going counts per post and the current user's RSVP status per post.
 */
export function useMeetupRsvp(meetupPostIds) {
  const { user } = useContext(AuthContext);
  const [goingCounts, setGoingCounts] = useState({});   // postId → number
  const [myRsvps, setMyRsvps] = useState({});            // postId → 'going' | 'not_going' | null
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meetupPostIds.length) return;

    async function fetch() {
      setLoading(true);

      // All RSVPs for these posts
      const { data } = await supabase
        .from('tribe_post_rsvps')
        .select('post_id, user_id, status')
        .in('post_id', meetupPostIds);

      if (data) {
        const counts = {};
        const mine = {};
        for (const r of data) {
          if (r.status === 'going') counts[r.post_id] = (counts[r.post_id] ?? 0) + 1;
          if (user && r.user_id === user.id) mine[r.post_id] = r.status;
        }
        setGoingCounts(counts);
        setMyRsvps(mine);
      }
      setLoading(false);
    }

    fetch();
  }, [meetupPostIds.join(','), user?.id]);

  const toggleRsvp = useCallback(async (postId, status) => {
    if (!user) return;
    const current = myRsvps[postId] ?? null;

    if (current === status) {
      // Remove RSVP (toggle off)
      setMyRsvps((prev) => { const n = { ...prev }; delete n[postId]; return n; });
      if (status === 'going') setGoingCounts((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 1) - 1) }));
      await supabase.from('tribe_post_rsvps').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      // Upsert new status
      const wasGoing = current === 'going';
      const nowGoing = status === 'going';
      setMyRsvps((prev) => ({ ...prev, [postId]: status }));
      setGoingCounts((prev) => {
        let c = prev[postId] ?? 0;
        if (wasGoing) c -= 1;
        if (nowGoing) c += 1;
        return { ...prev, [postId]: Math.max(0, c) };
      });
      await supabase.from('tribe_post_rsvps').upsert(
        { post_id: postId, user_id: user.id, status },
        { onConflict: 'post_id,user_id' }
      );
    }
  }, [user, myRsvps]);

  return { goingCounts, myRsvps, loading, toggleRsvp };
}
