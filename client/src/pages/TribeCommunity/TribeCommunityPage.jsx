import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useConnections } from '../../hooks/useConnections.js';
import { useProfile } from '../../hooks/useProfile.js';
import { useTribePosts } from '../../hooks/useTribePosts.js';
import { usePostLikes } from '../../hooks/usePostLikes.js';
import { useReactions } from '../../hooks/useReactions.js';
import { useConnectionActivity, isMilestone } from '../../hooks/useConnectionActivity.js';
import { useMeetupRsvp } from '../../hooks/useMeetupRsvp.js';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import ReportModal from '../../components/common/ReportModal.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import CommentPanel, { useCommentState } from '../../components/common/CommentPanel.jsx';
import PostCard from '../../components/common/PostCard.jsx';
import { timeAgo } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import './TribeCommunityPage.css';

const TRIBE_BADGE_MAP = {
  achievement: ['badge-achievement', '🏆 Achievement'],
  meetup: ['badge-meetup', '📅 Meetup'],
  general: ['badge-general', '💬 General'],
};

export default function TribeCommunityPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { acceptedConnections } = useConnections();
  const { posts, loading: postsLoading, createPost } = useTribePosts(null);
  const toast = useToast();
  const commentState = useCommentState(posts);
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const { counts: reactionCounts, myReactions, loadReactions, toggleReaction } = useReactions();
  useEffect(() => { if (postIds.length) loadReactions(postIds); }, [postIds.join(',')]);
  const postsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return posts.filter((p) => p.created_at?.startsWith(today)).length;
  }, [posts]);
  const { likedIds, toggleLike, toggling } = usePostLikes(postIds, 'tribe');
  const [localLikeCounts, setLocalLikeCounts] = useState({});

  const meetupPostIds = useMemo(() => posts.filter((p) => p.post_type === 'meetup').map((p) => p.id), [posts]);
  const { goingCounts, myRsvps, toggleRsvp } = useMeetupRsvp(meetupPostIds);

  const trendingTags = useMemo(() => {
    const now = Date.now();
    const DAY  = 86_400_000;
    const WEEK = 7 * DAY;
    const scores = {};
    posts.forEach((p) => {
      const age    = now - new Date(p.created_at).getTime();
      const weight = age < DAY ? 4 : age < WEEK ? 2 : 1;
      (p.content.match(/#\w+/g) ?? []).forEach((tag) => {
        const t = tag.toLowerCase();
        scores[t] = (scores[t] ?? 0) + weight;
      });
    });
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, score]) => ({ tag, posts: score }));
  }, [posts]);

  const [feedTab, setFeedTab] = useState('circle');
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [postType, setPostType] = useState('general');
  const [content, setContent] = useState('');
  const [milestone, setMilestone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportPost, setReportPost] = useState(null);

  const connectedUserIds = useMemo(() => {
    if (!user) return new Set();
    const ids = acceptedConnections.map((c) =>
      c.requester_id === user.id ? c.receiver_id : c.requester_id
    );
    return new Set([user.id, ...ids]);
  }, [acceptedConnections, user]);

  const { activity: circleActivity, loading: circleLoading } = useConnectionActivity(acceptedConnections);

  const applyTypeFilter = (list) => {
    if (filter === 'all') return list;
    return list.filter((p) => {
      const t = p.post_type ?? 'general';
      if (filter === 'achievements') return t === 'achievement';
      if (filter === 'meetups') return t === 'meetup';
      if (filter === 'general') return t === 'general';
      return true;
    });
  };

  const sparkPosts = useMemo(
    () => applyTypeFilter(posts.filter((p) => connectedUserIds.has(p.user_id))),
    [posts, connectedUserIds, filter]
  );
  const communityPosts = useMemo(() => applyTypeFilter(posts), [posts, filter]);
  const allDisplayedPosts = feedTab === 'sparks' ? sparkPosts : communityPosts;
  const displayedPosts = allDisplayedPosts.slice(0, visibleCount);

  async function submitPost() {
    if (!content.trim()) { toast('Write something before posting!', 'warning'); return; }
    setSubmitting(true);
    const { error, moderation } = await createPost({ content, post_type: postType, milestone: postType === 'achievement' ? milestone : null });
    setSubmitting(false);
    if (moderation) { toast(moderation.message, moderation.type === 'crisis' ? 'warning' : 'error', 7000); return; }
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowModal(false);
    setContent('');
    setMilestone('');
    setPostType('general');
  }

  const emptyMessage = feedTab === 'sparks'
    ? connectedUserIds.size <= 1
      ? 'Send sparks to people on the Connections page to see their posts here.'
      : 'None of your spark connections have posted yet — check back soon!'
    : 'No posts yet — be the first to share something!';

  return (
    <div className="tribe-page">
      <section className="page-header">
        <h1 className="page-title">Feed</h1>
        <p className="page-subtitle">Share your wins, support your people</p>
      </section>

      <div className="community-grid">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <button className="create-post-btn" onClick={() => setShowModal(true)}>
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Post
          </button>

          <div className="sidebar-card">
            <h3 className="sidebar-title">Filter Posts</h3>
            <div className="filter-options">
              {[['all', 'All Posts'], ['achievements', '🏆 Achievements'], ['meetups', '📅 Meetups'], ['general', '💬 General']].map(([val, lbl]) => (
                <button key={val} className={`filter-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>{lbl}</button>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">🔥 Trending Now</h3>
            <div className="trending-list">
              {trendingTags.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0, fontWeight: 500 }}>
                  No hashtags yet — add one to your next post!
                </p>
              ) : trendingTags.map((t) => (
                <div key={t.tag} className="trending-item">
                  <div className="trending-tag">{t.tag}</div>
                  <div className="trending-count">{t.posts} post{t.posts !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile toolbar — visible only on small screens */}
        <div className="mobile-tribe-toolbar">
          <button className="mobile-post-btn" onClick={() => setShowModal(true)}>+ Post</button>
        </div>

        {/* Main Feed */}
        <main className="main-feed">
          <div className="feed-tabs">
            <button
              className={`feed-tab${feedTab === 'circle' ? ' active' : ''}`}
              onClick={() => { setFeedTab('circle'); setVisibleCount(10); }}
            >
              🔥 My Circle
              {(circleActivity.length + sparkPosts.length) > 0 && (
                <span className="feed-tab-count">{circleActivity.length + sparkPosts.length}</span>
              )}
            </button>
            <button
              className={`feed-tab${feedTab === 'community' ? ' active' : ''}`}
              onClick={() => { setFeedTab('community'); setVisibleCount(10); }}
            >
              🌍 Community
              <span className="feed-tab-count">{posts.length}</span>
            </button>
          </div>

          {/* My Circle — unified feed of check-ins + posts */}
          {feedTab === 'circle' && (() => {
            const checkInItems = circleActivity.map((item) => ({
              _type: 'checkin',
              _ts: item.updated_at,
              ...item,
            }));
            const postItems = sparkPosts.map((p) => ({
              _type: 'post',
              _ts: p.created_at,
              ...p,
            }));
            const merged = [...checkInItems, ...postItems].sort(
              (a, b) => new Date(b._ts) - new Date(a._ts)
            );
            const isLoading = circleLoading || postsLoading;
            return (
              <div className="feed-container">
                {isLoading && <div className="feed-empty">Loading...</div>}
                {!isLoading && acceptedConnections.length === 0 && (
                  <div className="feed-empty">Connect with people on the Sparks page to see their activity here.</div>
                )}
                {!isLoading && acceptedConnections.length > 0 && merged.length === 0 && (
                  <div className="feed-empty">No activity yet from your connections — check back soon!</div>
                )}
                {merged.map((item) => {
                  if (item._type === 'checkin') {
                    const p = item.profiles;
                    const name = getDisplayName(p, 'Someone');
                    const milestone = isMilestone(item.day_count);
                    return (
                      <div key={`ci-${item.id}`} className={`circle-activity-card${milestone ? ' milestone' : ''}`}>
                        <Link to={`/profile/${item.user_id}`} className="circle-avatar-link">
                          <Avatar url={p?.avatar_url} name={name} size={44} />
                        </Link>
                        <div className="circle-activity-body">
                          <div className="circle-activity-text">
                            <Link to={`/profile/${item.user_id}`} className="circle-activity-name">{name}</Link>
                            {milestone
                              ? <span> hit a <strong>{item.day_count}-day milestone</strong> on "{item.title}" 🎉</span>
                              : <span> checked in on "<strong>{item.title}</strong>" — {item.day_count} day streak</span>}
                          </div>
                          {p?.alter_ego_name && <div className="circle-activity-ego">⚡ {p.alter_ego_name}</div>}
                          <div className="circle-activity-time">{timeAgo(item.updated_at)}</div>
                        </div>
                        {milestone && <div className="circle-milestone-badge">🏆 {item.day_count} days</div>}
                      </div>
                    );
                  }
                  return (
                    <PostCard
                      key={`post-${item.id}`}
                      post={item}
                      onLike={handleLike}
                      onShare={async (p) => {
                        const snippet = p.content.length > 120 ? p.content.slice(0, 120).trimEnd() + '…' : p.content;
                        if (navigator.share) {
                          try { await navigator.share({ title: 'ActPar', text: snippet }); } catch {}
                        } else {
                          await navigator.clipboard.writeText(snippet);
                          toast('Copied to clipboard!', 'success');
                        }
                      }}
                      onReport={(id, uid) => setReportPost({ id, user_id: uid })}
                      commentState={commentState}
                      likedIds={likedIds}
                      toggling={toggling}
                      likeCount={localLikeCounts[item.id] ?? item.likes ?? 0}
                      badgeMap={TRIBE_BADGE_MAP}
                      truncateAt={300}
                      showMilestone
                      commentPostType="tribe"
                      avatarSize={42}
                      rsvpGoingCount={goingCounts[item.id] ?? 0}
                      rsvpMyStatus={myRsvps[item.id] ?? null}
                      onRsvp={toggleRsvp}
                      reactionCounts={reactionCounts[item.id]}
                      myReaction={myReactions[item.id]}
                      onReact={toggleReaction}
                    />
                  );
                })}
              </div>
            );
          })()}

          {/* Posts feed */}
          {feedTab !== 'circle' && (
          <div className="feed-container">
            {postsLoading && <div className="feed-empty">Loading posts...</div>}
            {!postsLoading && allDisplayedPosts.length === 0 && (
              <div className="feed-empty">{emptyMessage}</div>
            )}
            {displayedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onShare={async (p) => {
                  const snippet = p.content.length > 120 ? p.content.slice(0, 120).trimEnd() + '…' : p.content;
                  if (navigator.share) {
                    try { await navigator.share({ title: 'ActPar', text: snippet }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(snippet);
                    toast('Copied to clipboard!', 'success');
                  }
                }}
                onReport={(id, uid) => setReportPost({ id, user_id: uid })}
                commentState={commentState}
                likedIds={likedIds}
                toggling={toggling}
                likeCount={localLikeCounts[post.id] ?? post.likes ?? 0}
                badgeMap={TRIBE_BADGE_MAP}
                truncateAt={300}
                showMilestone
                commentPostType="tribe"
                avatarSize={42}
                rsvpGoingCount={goingCounts[post.id] ?? 0}
                rsvpMyStatus={myRsvps[post.id] ?? null}
                onRsvp={toggleRsvp}
                reactionCounts={reactionCounts[post.id]}
                myReaction={myReactions[post.id]}
                onReact={toggleReaction}
              />
            ))}
            {visibleCount < allDisplayedPosts.length && (
              <button className="load-more-btn" onClick={() => setVisibleCount((n) => n + 10)}>
                Load more posts
              </button>
            )}
          </div>
          )}
        </main>

      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Post</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Post Type</label>
                <div className="post-type-buttons">
                  {[['general', '💬 General'], ['achievement', '🏆 Achievement'], ['meetup', '📅 Meetup']].map(([val, lbl]) => (
                    <button key={val} className={`type-btn${postType === val ? ' active' : ''}`} onClick={() => setPostType(val)}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>What's on your mind?</label>
                <textarea className="post-textarea" rows="5" placeholder="Share your thoughts..." value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              {postType === 'achievement' && (
                <div className="form-group">
                  <label>Milestone Reached</label>
                  <input type="text" className="input-field" placeholder="e.g., 30-day streak" value={milestone} onChange={(e) => setMilestone(e.target.value)} />
                </div>
              )}
              <button className="submit-post-btn" onClick={submitPost} disabled={submitting}>
                {submitting ? 'Posting...' : 'Post to Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportPost && (
        <ReportModal
          postId={reportPost.id}
          reportedUserId={reportPost.user_id}
          onClose={() => setReportPost(null)}
        />
      )}
    </div>
  );

  function handleLike(id, currentLikes) {
    const post = displayedPosts.find((p) => p.id === id);
    toggleLike(id, currentLikes, (postId, newCount) =>
      setLocalLikeCounts((prev) => ({ ...prev, [postId]: newCount })),
      post?.user_id ?? null
    );
  }
}
