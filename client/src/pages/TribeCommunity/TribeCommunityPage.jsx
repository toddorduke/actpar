import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useConnections } from '../../hooks/useConnections.js';
import { useCommunities } from '../../hooks/useCommunities.js';
import { useProfile } from '../../hooks/useProfile.js';
import { useTribePosts } from '../../hooks/useTribePosts.js';
import { usePostLikes } from '../../hooks/usePostLikes.js';
import { useConnectionActivity, isMilestone } from '../../hooks/useConnectionActivity.js';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../components/common/Toast.jsx';
import ReportModal from '../../components/common/ReportModal.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import CommentPanel, { useCommentState } from '../../components/common/CommentPanel.jsx';
import './TribeCommunityPage.css';


const POST_TRUNCATE_LENGTH = 300;

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post, onLike, onShare, onReport, commentState, likedIds, toggling, likeCount }) {
  const { openPanels, commentsByPost, loadingPost, togglePanel, addComment, deleteComment, commentCount } = commentState;
  const liked = likedIds.has(post.id);
  const isToggling = toggling.has(post.id);
  const badgeMap = {
    achievement: ['badge-achievement', '🏆 Achievement'],
    meetup: ['badge-meetup', '📅 Meetup'],
    general: ['badge-general', '💬 General'],
  };
  const type = post.post_type ?? 'general';
  const [cls, label] = badgeMap[type] || badgeMap.general;
  const [expanded, setExpanded] = useState(false);
  const count = commentCount(post.id);
  const isOpen = !!openPanels[post.id];

  const authorName = post.profiles
    ? `${post.profiles.first_name ?? ''} ${post.profiles.last_name ?? ''}`.trim() || 'Community Member'
    : 'Community Member';

  const isTruncated = post.content.length > POST_TRUNCATE_LENGTH;
  const displayedContent = isTruncated && !expanded
    ? post.content.slice(0, POST_TRUNCATE_LENGTH).trimEnd() + '...'
    : post.content;

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.user_id}`} className="post-author-link">
          <Avatar url={post.profiles?.avatar_url} name={authorName} size={42} />
        </Link>
        <div className="post-author-info">
          <Link to={`/profile/${post.user_id}`} className="post-author-name post-author-link">{authorName}</Link>
          <div className="post-timestamp">{timeAgo(post.created_at)}</div>
        </div>
        <span className={`post-badge ${cls}`}>{label}</span>
      </div>
      <div className="post-content">
        <p className="post-text">
          {displayedContent}
          {isTruncated && (
            <button className="see-more-btn" onClick={() => setExpanded((v) => !v)}>
              {expanded ? ' See less' : ' See more'}
            </button>
          )}
        </p>
        {type === 'achievement' && post.milestone && (
          <div className="achievement-milestone">🏆 {post.milestone}</div>
        )}
      </div>
      <div className="post-actions">
        <button
          className={`action-btn${liked ? ' active liked' : ''}`}
          onClick={() => onLike(post.id, likeCount ?? post.likes ?? 0)}
          disabled={isToggling}
        >
          <svg className="action-icon" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likeCount ?? post.likes ?? 0}
        </button>
        <button className={`action-btn${isOpen ? ' active' : ''}`} onClick={() => togglePanel(post.id)}>
          <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {count > 0 ? count : ''} Comment{count !== 1 ? 's' : ''}
        </button>
        <button className="action-btn" onClick={() => onShare(post)}>
          <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
        <button className="action-btn report-btn" onClick={onReport}>
          <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          Report
        </button>
      </div>
      {isOpen && (
        <CommentPanel
          postId={post.id}
          postType="tribe"
          comments={commentsByPost[post.id] ?? []}
          loading={!!loadingPost[post.id]}
          onAdd={addComment}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}

export default function TribeCommunityPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { acceptedConnections } = useConnections();
  const { myCommunities, communities, myMemberships, createCommunity, joinCommunity, leaveCommunity } = useCommunities();
  const { posts, loading: postsLoading, createPost } = useTribePosts(null);
  const toast = useToast();
  const commentState = useCommentState();
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const postsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return posts.filter((p) => p.created_at?.startsWith(today)).length;
  }, [posts]);
  const [memberCount, setMemberCount] = useState(null);
  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count != null) setMemberCount(count);
    });
  }, []);
  const { likedIds, toggleLike, toggling } = usePostLikes(postIds, 'tribe');
  const [localLikeCounts, setLocalLikeCounts] = useState({});

  const trendingTags = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      const matches = p.content.match(/#\w+/g) ?? [];
      matches.forEach((tag) => {
        const t = tag.toLowerCase();
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, posts: count }));
  }, [posts]);

  // Communities the user hasn't joined yet, sorted by relevance to their looking_for
  const discoverCommunities = useMemo(() => {
    const lookingFor = (profile?.looking_for ?? []).map((s) => s.toLowerCase());
    const unjoined = communities.filter((c) => !myMemberships.includes(c.id));
    if (!lookingFor.length) return unjoined;
    return unjoined.sort((a, b) => {
      const score = (c) => lookingFor.reduce((n, kw) =>
        n + ((c.name ?? '').toLowerCase().includes(kw) || (c.description ?? '').toLowerCase().includes(kw) ? 1 : 0), 0
      );
      return score(b) - score(a);
    });
  }, [communities, myMemberships, profile]);

  const [feedTab, setFeedTab] = useState('circle');
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [postType, setPostType] = useState('general');
  const [content, setContent] = useState('');
  const [milestone, setMilestone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateComm, setShowCreateComm] = useState(false);
  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [creatingComm, setCreatingComm] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
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

  async function submitCreateCommunity() {
    if (!commName.trim()) return;
    setCreatingComm(true);
    const { data, error } = await createCommunity({ name: commName, description: commDesc });
    setCreatingComm(false);
    if (error) { toast(`Error: ${error.message}`, 'error'); return; }
    setShowCreateComm(false);
    setCommName('');
    setCommDesc('');
    toast('Community created! 🎉', 'success');
    if (data) navigate(`/community/${data.id}`);
  }

  const emptyMessage = feedTab === 'sparks'
    ? connectedUserIds.size <= 1
      ? 'Send sparks to people on the Connections page to see their posts here.'
      : 'None of your spark connections have posted yet — check back soon!'
    : 'No posts yet — be the first to share something!';

  return (
    <div className="tribe-page">
      <section className="page-header">
        <h1 className="page-title">Tribe</h1>
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

          {/* My Communities */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">My Communities</h3>
            <div className="community-list">
              {myCommunities.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
                  No communities yet — create or join one below!
                </p>
              )}
              {myCommunities.map((c) => (
                <button
                  key={c.id}
                  className="community-list-item"
                  onClick={() => navigate(`/community/${c.id}`)}
                >
                  <div className="community-list-avatar">
                    {c.avatar_url
                      ? <img src={c.avatar_url} alt={c.name} />
                      : c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="community-list-info">
                    <div className="community-list-name">{c.name}</div>
                    <div className="community-list-meta">Tap to open →</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="community-actions">
              <button className="comm-action-btn" onClick={() => setShowCreateComm(true)}>+ Create</button>
              <button className="comm-action-btn" onClick={() => setShowBrowse(true)}>Browse</button>
            </div>
          </div>

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
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
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
          <div className="mobile-comm-scroll">
            {myCommunities.map((c) => (
              <button key={c.id} className="mobile-comm-chip" onClick={() => navigate(`/community/${c.id}`)}>
                {c.name}
              </button>
            ))}
            <button className="mobile-comm-chip mobile-comm-chip--add" onClick={() => setShowCreateComm(true)}>+ New</button>
          </div>
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
                    const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'Someone';
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
                  // Post item
                  const authorName = item.profiles
                    ? `${item.profiles.first_name ?? ''} ${item.profiles.last_name ?? ''}`.trim() || 'Member'
                    : 'Member';
                  return (
                    <PostCard
                      key={`post-${item.id}`}
                      post={item}
                      onLike={handleLike}
                      onShare={async () => {
                        const snippet = item.content.length > 120 ? item.content.slice(0, 120).trimEnd() + '…' : item.content;
                        if (navigator.share) {
                          try { await navigator.share({ title: 'ActPar', text: snippet }); } catch {}
                        } else {
                          await navigator.clipboard.writeText(snippet);
                          toast('Copied to clipboard!', 'success');
                        }
                      }}
                      onReport={() => setReportPost({ id: item.id, user_id: item.user_id })}
                      commentState={commentState}
                      likedIds={likedIds}
                      toggling={toggling}
                      likeCount={localLikeCounts[item.id] ?? item.likes ?? 0}
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
                onShare={async (post) => {
                  const snippet = post.content.length > 120 ? post.content.slice(0, 120).trimEnd() + '…' : post.content;
                  if (navigator.share) {
                    try { await navigator.share({ title: 'ActPar', text: snippet }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(snippet);
                    toast('Copied to clipboard!', 'success');
                  }
                }}
                onReport={() => setReportPost({ id: post.id, user_id: post.user_id })}
                commentState={commentState}
                likedIds={likedIds}
                toggling={toggling}
                likeCount={localLikeCounts[post.id] ?? post.likes ?? 0}
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

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">📊 Community Stats</h3>
            <div className="stats-grid">
              <div className="stat-item"><div className="stat-number">{memberCount ?? '—'}</div><div className="stat-label">Members</div></div>
              <div className="stat-item"><div className="stat-number">{postsToday}</div><div className="stat-label">Posts Today</div></div>
              <div className="stat-item"><div className="stat-number">{connectedUserIds.size > 1 ? connectedUserIds.size - 1 : 0}</div><div className="stat-label">My Sparks</div></div>
              <div className="stat-item"><div className="stat-number">{posts.length}</div><div className="stat-label">Posts</div></div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">✨ Discover Communities</h3>
            {discoverCommunities.length === 0 ? (
              <p className="discover-empty">You've joined all available communities!</p>
            ) : (
              <div className="discover-list">
                {discoverCommunities.slice(0, 5).map((c) => (
                  <div key={c.id} className="discover-item">
                    <div className="discover-avatar">{c.name.charAt(0).toUpperCase()}</div>
                    <div className="discover-info">
                      <div className="discover-name">{c.name}</div>
                      {c.description && <div className="discover-desc">{c.description}</div>}
                    </div>
                    <button
                      className="discover-join-btn"
                      onClick={async () => {
                        await joinCommunity(c.id);
                        navigate(`/community/${c.id}`);
                      }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
            {discoverCommunities.length > 5 && (
              <button className="discover-more-btn" onClick={() => setShowBrowse(true)}>
                See all {discoverCommunities.length} communities →
              </button>
            )}
          </div>
        </aside>
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

      {/* Create Community Modal */}
      {showCreateComm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateComm(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create a Community</h2>
              <button className="close-modal" onClick={() => setShowCreateComm(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Community Name</label>
                <input type="text" className="input-field" placeholder="e.g., Morning Run Club" value={commName} onChange={(e) => setCommName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea className="post-textarea" rows="3" placeholder="What is this community about?" value={commDesc} onChange={(e) => setCommDesc(e.target.value)} />
              </div>
              <button className="submit-post-btn" onClick={submitCreateCommunity} disabled={creatingComm || !commName.trim()}>
                {creatingComm ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Communities Modal */}
      {showBrowse && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowBrowse(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Browse Communities</h2>
              <button className="close-modal" onClick={() => setShowBrowse(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {communities.length === 0 && (
                <p style={{ color: '#6b7280', textAlign: 'center' }}>No communities yet — create the first one!</p>
              )}
              <div className="browse-comm-list">
                {communities.map((c) => {
                  const isMember = myMemberships.includes(c.id);
                  return (
                    <div key={c.id} className="browse-comm-item">
                      <div className="browse-comm-avatar">{c.name.charAt(0).toUpperCase()}</div>
                      <div className="browse-comm-info">
                        <div className="browse-comm-name">{c.name}</div>
                        {c.description && <div className="browse-comm-desc">{c.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={isMember ? 'leave-comm-btn' : 'join-comm-btn'}
                          onClick={() => isMember ? leaveCommunity(c.id) : joinCommunity(c.id)}
                        >
                          {isMember ? 'Leave' : 'Join'}
                        </button>
                        {isMember && (
                          <button className="join-comm-btn" onClick={() => { setShowBrowse(false); navigate(`/community/${c.id}`); }}>
                            Open
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
