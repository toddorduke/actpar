import { useCallback, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

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
