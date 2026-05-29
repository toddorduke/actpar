import { useCallback, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export const REACTION_EMOJIS = [
  { key: 'fire',   label: '🔥' },
  { key: 'muscle', label: '💪' },
  { key: 'star',   label: '✨' },
];

export function useReactions() {
  const { user } = useContext(AuthContext);
  const [counts, setCounts]         = useState({});  // { postId: { fire:N, muscle:N, star:N } }
  const [myReactions, setMyReactions] = useState({}); // { postId: 'fire'|'muscle'|'star'|null }

  const loadReactions = useCallback(async (postIds) => {
    if (!postIds.length || !user) return;
    const { data } = await supabase
      .from('post_reactions')
      .select('post_id, user_id, emoji')
      .in('post_id', postIds);
    if (!data) return;

    const newCounts = {};
    const newMine = {};
    postIds.forEach(id => { newCounts[id] = { fire: 0, muscle: 0, star: 0 }; });
    data.forEach(r => {
      if (newCounts[r.post_id]) newCounts[r.post_id][r.emoji] = (newCounts[r.post_id][r.emoji] || 0) + 1;
      if (r.user_id === user.id) newMine[r.post_id] = r.emoji;
    });
    setCounts(newCounts);
    setMyReactions(newMine);
  }, [user]);

  const toggleReaction = useCallback(async (postId, emoji) => {
    if (!user) return;
    const current = myReactions[postId] ?? null;

    if (current === emoji) {
      // Remove
      setMyReactions(prev => { const n = { ...prev }; delete n[postId]; return n; });
      setCounts(prev => ({
        ...prev,
        [postId]: { ...prev[postId], [emoji]: Math.max(0, (prev[postId]?.[emoji] ?? 1) - 1) },
      }));
      await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      // Add or switch
      setMyReactions(prev => ({ ...prev, [postId]: emoji }));
      setCounts(prev => {
        const cur = prev[postId] ?? { fire: 0, muscle: 0, star: 0 };
        const updated = { ...cur, [emoji]: (cur[emoji] ?? 0) + 1 };
        if (current) updated[current] = Math.max(0, (cur[current] ?? 1) - 1);
        return { ...prev, [postId]: updated };
      });
      await supabase.from('post_reactions').upsert(
        { post_id: postId, user_id: user.id, emoji },
        { onConflict: 'post_id,user_id' }
      );
    }
  }, [user, myReactions]);

  return { counts, myReactions, loadReactions, toggleReaction };
}
