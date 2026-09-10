import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText } from '../utils/contentModeration.js';
import { track, Events } from '../lib/analytics.js';

// `paginate: true` switches from the one-shot 200-post fetch to real
// cursor-based paging (used by the Feed/Explore page's infinite scroll).
// Left off (the default), every other caller keeps its existing behavior
// unchanged -- several of them do their own client-side "load more" over
// the full in-memory batch, which depends on that batch already holding
// everything up to the 200 cap.
export const useTribePosts = (communityId = null, { paginate = false, pageSize = 20 } = {}) => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('tribe_posts')
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(paginate ? pageSize : 200);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data } = await query;
    setPosts(data ?? []);
    if (paginate) setHasMore((data ?? []).length === pageSize);
    setLoading(false);
  }, [communityId, paginate, pageSize]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (!paginate || loadingMore || !hasMore || !posts.length) return;
    setLoadingMore(true);
    // Real seed/production data has posts sharing the exact same created_at
    // (batch inserts, or genuinely simultaneous posts) -- a plain
    // `created_at < cursor` cursor silently drops any row tied with the
    // boundary post once they span a page edge. Order and cursor on the
    // compound (created_at, id) so the sort is a strict total order.
    const cursor = posts[posts.length - 1];
    let query = supabase
      .from('tribe_posts')
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
      .limit(pageSize);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data } = await query;
    setPosts((prev) => [...prev, ...(data ?? [])]);
    setHasMore((data ?? []).length === pageSize);
    setLoadingMore(false);
  }, [paginate, loadingMore, hasMore, posts, communityId, pageSize]);

  const createPost = useCallback(async ({ content, post_type, milestone, community_id, media_url, event_date, location }) => {
    const modResult = checkText(content);
    if (!modResult.ok) return { data: null, error: null, moderation: modResult };
    if (milestone) {
      const milestoneCheck = checkText(milestone);
      if (!milestoneCheck.ok) return { data: null, error: null, moderation: milestoneCheck };
    }
    if (location) {
      const locationCheck = checkText(location);
      if (!locationCheck.ok) return { data: null, error: null, moderation: locationCheck };
    }

    const { data, error } = await supabase
      .from('tribe_posts')
      .insert({
        user_id: user.id,
        content,
        post_type,
        milestone: milestone || null,
        community_id: community_id || null,
        media_url: media_url || null,
        event_date: event_date || null,
        location: location || null,
      })
      .select('*, profiles!tribe_posts_user_id_fkey(first_name, last_name, alter_ego_name, avatar_url, id)')
      .single();
    if (!error) {
      setPosts((prev) => [data, ...prev]);
      track(Events.POST_CREATED, { post_type });
    }
    return { data, error };
  }, [user]);

  const deletePost = useCallback(async (postId) => {
    const mediaUrl = posts.find((p) => p.id === postId)?.media_url;
    const { error } = await supabase.from('tribe_posts').delete().eq('id', postId);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (mediaUrl) {
        const path = mediaUrl.split('/media/')[1];
        if (path) await supabase.storage.from('media').remove([path]);
      }
    }
    return { error };
  }, [posts]);

  return { posts, loading, loadingMore, hasMore, loadMore, createPost, deletePost, refetch: fetchPosts };
};
