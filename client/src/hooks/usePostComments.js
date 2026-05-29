import { useCallback, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';
import { createNotification } from './useNotifications.js';

export const usePostComments = () => {
  const { user } = useContext(AuthContext);
  // Map of postId -> comment array
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

  const addComment = useCallback(async (postId, postType, content) => {
    if (!content.trim() || !user) return { error: new Error('Missing data') };
    const modResult = checkText(content);
    if (!modResult.ok) return { data: null, error: null, moderation: modResult };
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, post_type: postType, user_id: user.id, content: content.trim() })
      .select('*, profiles(id, first_name, last_name, avatar_url)')
      .single();
    if (!error && data) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), data],
      }));
      // Notify the post owner (fire-and-forget — don't block UI)
      supabase.from('tribe_posts').select('user_id').eq('id', postId).single().then(({ data: post }) => {
        if (post?.user_id && post.user_id !== user.id) {
          createNotification({
            userId: post.user_id,
            actorId: user.id,
            type: 'post_like',
            refId: postId,
            body: 'commented on your post 💬',
          });
        }
      });
    }
    return { data, error };
  }, [user]);

  const deleteComment = useCallback(async (postId, commentId) => {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (!error) {
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId),
      }));
    }
    return { error };
  }, []);

  return { commentsByPost, loadingPost, fetchComments, addComment, deleteComment };
};
