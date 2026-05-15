import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import CommentPanel from './CommentPanel.jsx';
import { timeAgo } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';

const HEART_SVG = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
);
const BUBBLE_SVG = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
);

/**
 * Shared PostCard for Pact and Tribe feeds.
 *
 * Props:
 *  post, onLike, onReport, commentState, likedIds, toggling
 *  likeCount          — override like count (for optimistic UI)
 *  onViewProfile      — if provided, author renders as buttons using this callback (Pact)
 *                       if omitted, author renders as Links to /profile/:id (Tribe)
 *  onShare            — if provided, shows Share button; also changes report to flag style (Tribe)
 *  currentUserId      — when onShare is absent, report button is hidden for own posts
 *  badgeMap           — { type: [cssClass, label] }
 *  truncateAt         — character limit for content (number); omit to show full content
 *  showMilestone      — if true, shows achievement-milestone div for 'achievement' posts
 *  commentPostType    — 'pact' | 'tribe'
 *  avatarSize         — default 40
 */
export default function PostCard({
  post,
  onLike,
  onReport,
  commentState,
  likedIds,
  toggling,
  likeCount,
  onViewProfile,
  onShare,
  currentUserId,
  badgeMap = {},
  truncateAt,
  showMilestone = false,
  commentPostType = 'tribe',
  avatarSize = 40,
}) {
  const { openPanels, commentsByPost, loadingPost, togglePanel, addComment, deleteComment, commentCount } = commentState;
  const [expanded, setExpanded] = useState(false);

  const liked = likedIds?.has(post.id) ?? false;
  const isToggling = toggling?.has(post.id) ?? false;
  const isOpen = !!openPanels[post.id];
  const count = commentCount(post.id);

  const type = post.post_type ?? Object.keys(badgeMap)[0] ?? 'general';
  const [badgeCls, badgeLabel] = badgeMap[type] ?? ['', ''];
  const authorName = getDisplayName(post.profiles);

  const isTruncated = truncateAt && post.content.length > truncateAt && !expanded;
  const displayContent = isTruncated
    ? post.content.slice(0, truncateAt).trimEnd() + '...'
    : post.content;

  const isOwnPost = post.user_id === currentUserId;
  const showReport = onReport && (onShare ? true : !isOwnPost);

  const avatarEl = (
    <Avatar url={post.profiles?.avatar_url} name={authorName} size={avatarSize} />
  );

  return (
    <div className="post-card">
      <div className="post-header">
        {onViewProfile ? (
          <button className="post-author-btn" onClick={() => onViewProfile(post.user_id)}>
            {avatarEl}
          </button>
        ) : (
          <Link to={`/profile/${post.user_id}`} className="post-author-link">
            {avatarEl}
          </Link>
        )}

        <div className="post-author-info">
          {onViewProfile ? (
            <button className="post-author-btn post-author-name" onClick={() => onViewProfile(post.user_id)}>
              {authorName}
            </button>
          ) : (
            <Link to={`/profile/${post.user_id}`} className="post-author-name post-author-link">
              {authorName}
            </Link>
          )}
          <div className="post-timestamp">{timeAgo(post.created_at)}</div>
        </div>

        {badgeLabel && <span className={`post-badge ${badgeCls}`}>{badgeLabel}</span>}

        {showReport && !onShare && (
          <button className="post-report-btn" onClick={() => onReport(post.id, post.user_id)} title="Report post">
            ⋯
          </button>
        )}
      </div>

      <div className="post-content">
        <p className="post-text">
          {displayContent}
          {truncateAt && post.content.length > truncateAt && (
            <button className="see-more-btn" onClick={() => setExpanded((v) => !v)}>
              {expanded ? ' See less' : ' See more'}
            </button>
          )}
        </p>
        {showMilestone && type === 'achievement' && post.milestone && (
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
            {HEART_SVG}
          </svg>
          {likeCount ?? post.likes ?? 0}
        </button>

        <button className={`action-btn${isOpen ? ' active' : ''}`} onClick={() => togglePanel(post.id)}>
          <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {BUBBLE_SVG}
          </svg>
          {count > 0 ? count : ''} Comment{count !== 1 ? 's' : ''}
        </button>

        {onShare && (
          <button className="action-btn" onClick={() => onShare(post)}>
            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        )}

        {showReport && onShare && (
          <button className="action-btn report-btn" onClick={() => onReport(post.id, post.user_id)}>
            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Report
          </button>
        )}
      </div>

      {isOpen && (
        <CommentPanel
          postId={post.id}
          postType={commentPostType}
          comments={commentsByPost[post.id] ?? []}
          loading={!!loadingPost[post.id]}
          onAdd={addComment}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}
