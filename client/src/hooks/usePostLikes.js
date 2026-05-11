import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { createNotification } from './useNotifications.js';

export const usePostLikes = (postIds = [], postType = 'tribe') => {
  const { user } = useContext(AuthContext);
  const [likedIds, setLikedIds] = useState(new Set());
  const [toggling, setToggling] = useState(new Set());

  useEffect(() => {
    if (!user || postIds.length === 0) return;
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('post_type', postType)
      .in('post_id', postIds)
      .then(({ data }) => {
        setLikedIds(new Set((data ?? []).map((r) => r.post_id)));
      });
  }, [user, postIds.join(','), postType]);

  // postOwnerId — optional, used to notify the post author on like
  const toggleLike = useCallback(async (postId, currentLikeCount, onCountChange, postOwnerId = null) => {
    if (!user || toggling.has(postId)) return;
    setToggling((prev) => new Set([...prev, postId]));

    const alreadyLiked = likedIds.has(postId);

    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    onCountChange(postId, alreadyLiked ? currentLikeCount - 1 : currentLikeCount + 1);

    if (alreadyLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      await supabase.rpc('decrement_post_likes', { p_post_id: postId, p_post_type: postType });
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, post_type: postType, user_id: user.id });
      if (!error) {
        await supabase.rpc('increment_post_likes', { p_post_id: postId, p_post_type: postType });
        // Notify post owner
        if (postOwnerId) {
          createNotification({
            userId: postOwnerId,
            actorId: user.id,
            type: 'post_like',
            refId: postId,
            body: 'liked your post ❤️',
          });
        }
      } else {
        // Race condition — already liked, roll back
        setLikedIds((prev) => { const next = new Set(prev); next.delete(postId); return next; });
        onCountChange(postId, currentLikeCount);
      }
    }

    setToggling((prev) => { const next = new Set(prev); next.delete(postId); return next; });
  }, [user, likedIds, toggling, postType]);

  return { likedIds, toggleLike, toggling };
};
