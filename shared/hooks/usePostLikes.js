import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient.js';
import { createNotification } from './useNotifications.js';

export function usePostLikes(userId, postIds = [], postType = 'tribe') {
  const [likedIds, setLikedIds] = useState(new Set());
  const [toggling, setToggling] = useState(new Set());

  useEffect(() => {
    if (!userId || postIds.length === 0) return;
    getSupabaseClient()
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_type', postType)
      .in('post_id', postIds)
      .then(({ data }) => {
        setLikedIds(new Set((data ?? []).map((r) => r.post_id)));
      });
  }, [userId, postIds.join(','), postType]);

  // postOwnerId — optional, used to notify the post author on like
  const toggleLike = useCallback(async (postId, currentLikeCount, onCountChange, postOwnerId = null) => {
    if (!userId || toggling.has(postId)) return;
    const supabase = getSupabaseClient();
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
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) {
        // Roll back the optimistic update
        setLikedIds((prev) => new Set([...prev, postId]));
        onCountChange(postId, currentLikeCount);
      }
      // The post_likes_count_trigger keeps the like count in sync — no
      // separate RPC call needed (and the old ones had no ownership check).
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, post_type: postType, user_id: userId });
      if (!error) {
        // Notify post owner
        if (postOwnerId && postOwnerId !== userId) {
          createNotification({
            userId: postOwnerId,
            actorId: userId,
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
  }, [userId, likedIds, toggling, postType]);

  return { likedIds, toggleLike, toggling };
}
