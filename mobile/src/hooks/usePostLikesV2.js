import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createNotificationV2 } from './useNotificationsV2';

// Direct port of client/src/hooks/usePostLikes.js -- no React-DOM-specific
// code there, so the logic carries over unchanged.
export function usePostLikesV2(userId, postIds = [], postType = 'tribe') {
  const [likedIds, setLikedIds] = useState(new Set());
  const [toggling, setToggling] = useState(new Set());

  useEffect(() => {
    if (!userId || postIds.length === 0) return;
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_type', postType)
      .in('post_id', postIds)
      .then(({ data }) => {
        setLikedIds(new Set((data ?? []).map((r) => r.post_id)));
      });
  }, [userId, postIds.join(','), postType]);

  const toggleLike = useCallback(async (postId, currentLikeCount, onCountChange, postOwnerId = null) => {
    if (!userId || toggling.has(postId)) return;
    setToggling((prev) => new Set([...prev, postId]));

    const alreadyLiked = likedIds.has(postId);

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
        setLikedIds((prev) => new Set([...prev, postId]));
        onCountChange(postId, currentLikeCount);
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, post_type: postType, user_id: userId });
      if (!error) {
        if (postOwnerId && postOwnerId !== userId) {
          createNotificationV2({ userId: postOwnerId, actorId: userId, type: 'post_like', refId: postId, body: 'liked your post ❤️' });
        }
      } else {
        setLikedIds((prev) => { const next = new Set(prev); next.delete(postId); return next; });
        onCountChange(postId, currentLikeCount);
      }
    }

    setToggling((prev) => { const next = new Set(prev); next.delete(postId); return next; });
  }, [userId, likedIds, toggling, postType]);

  return { likedIds, toggleLike, toggling };
}
