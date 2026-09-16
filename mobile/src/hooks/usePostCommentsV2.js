import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { checkText } from '../lib/contentModeration';
import { createNotificationV2 } from './useNotificationsV2';

// Mirrors client/src/hooks/usePostComments.js. post_comments.post_type is
// generic ('tribe' | 'pact'), so this same hook covers both post kinds.
export function usePostCommentsV2(userId) {
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingPost, setLoadingPost] = useState({});

  const fetchComments = useCallback(async (postId) => {
    setLoadingPost((prev) => ({ ...prev, [postId]: true }));
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(id, first_name, last_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setCommentsByPost((prev) => ({ ...prev, [postId]: data ?? [] }));
    setLoadingPost((prev) => ({ ...prev, [postId]: false }));
  }, []);

  const addComment = useCallback(async (postId, postType, content, ownerTable = 'tribe_posts') => {
    if (!content.trim() || !userId) return { error: new Error('Missing data') };
    const modResult = checkText(content);
    if (!modResult.ok) return { data: null, error: null, moderation: modResult };
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, post_type: postType, user_id: userId, content: content.trim() })
      .select('*, profiles(id, first_name, last_name, avatar_url)')
      .single();
    if (!error && data) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data] }));
      supabase.from(ownerTable).select('user_id').eq('id', postId).single().then(({ data: post }) => {
        if (post?.user_id && post.user_id !== userId) {
          createNotificationV2({ userId: post.user_id, actorId: userId, type: 'post_like', refId: postId, body: 'commented on your post 💬' });
        }
      });
    }
    return { data, error };
  }, [userId]);

  const deleteComment = useCallback(async (postId, commentId) => {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (!error) setCommentsByPost((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId) }));
    return { error };
  }, []);

  return { commentsByPost, loadingPost, fetchComments, addComment, deleteComment };
}
