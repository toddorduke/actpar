import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications.js';
import Avatar from '../../components/common/Avatar.jsx';
import { getDisplayName } from '../../utils/displayName.js';
import { timeAgo } from '../../utils/dateUtils.js';
import './NotificationsPage.css';

function notifTypeBadge(notif) {
  if (notif.type === 'connection_request') {
    const isSpark = notif.body?.includes('sparked');
    return <span className={`np-type-badge${isSpark ? ' spark' : ' connect'}`}>{isSpark ? '⚡' : '✓'}</span>;
  }
  if (notif.type === 'connection_accepted') return <span className="np-type-badge connect">✓</span>;
  if (notif.type === 'streak_milestone') return <span className="np-type-badge milestone">🔥</span>;
  if (notif.type === 'post_like') return <span className="np-type-badge like">❤️</span>;
  if (notif.type === 'cheer') return <span className="np-type-badge cheer">🎉</span>;
  if (notif.type === 'new_message') return <span className="np-type-badge msg">💬</span>;
  return null;
}

function groupByDate(notifications) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };
  for (const n of notifications) {
    const d = new Date(n.created_at);
    if (d >= startOfToday) groups['Today'].push(n);
    else if (d >= startOfYesterday) groups['Yesterday'].push(n);
    else if (d >= startOfWeek) groups['This Week'].push(n);
    else groups['Earlier'].push(n);
  }
  return groups;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();
  const [filter, setFilter] = useState('all');

  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const groups = groupByDate(visible);

  function handleClick(notif) {
    markRead(notif.id);
    if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
      navigate('/connections');
    } else if (notif.type === 'new_message') {
      navigate(`/messages?with=${notif.actor_id}`);
    } else if (notif.type === 'journey_invite' || notif.type === 'journey_accepted') {
      navigate('/connections');
    } else if (notif.type === 'post_like') {
      navigate(notif.ref_id ? `/post/${notif.ref_id}` : '/tribe-community');
    } else if (notif.type === 'streak_milestone' || notif.type === 'progress_complete') {
      navigate('/');
    } else if (notif.type === 'cheer') {
      navigate('/');
    } else if (notif.type === 'booking_request') {
      navigate(`/messages?with=${notif.actor_id}`);
    }
  }

  return (
    <div className="np-page">
      <div className="np-header">
        <h1 className="np-title">Notifications</h1>
        <div className="np-header-actions">
          {unreadCount > 0 && (
            <button className="np-mark-all-btn" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="np-filter-tabs">
        <button
          className={`np-filter-tab${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
          {notifications.length > 0 && <span className="np-filter-count">{notifications.length}</span>}
        </button>
        <button
          className={`np-filter-tab${filter === 'unread' ? ' active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
          {unreadCount > 0 && <span className="np-filter-count unread">{unreadCount}</span>}
        </button>
      </div>

      {loading && (
        <div className="np-loading">
          <div className="np-spinner" />
          <p>Loading notifications…</p>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="np-empty">
          <span className="np-empty-icon">🔔</span>
          <p>{filter === 'unread' ? "You're all caught up!" : "No notifications yet."}</p>
        </div>
      )}

      {!loading && (
        <div className="np-list">
          {Object.entries(groups).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label} className="np-group">
                <div className="np-group-label">{label}</div>
                {items.map((notif) => {
                  const actorName = notif.actor ? getDisplayName(notif.actor, 'Someone') : 'Someone';
                  return (
                    <div
                      key={notif.id}
                      className={`np-item${notif.read ? '' : ' unread'}`}
                      onClick={() => handleClick(notif)}
                    >
                      <div className="np-avatar-wrap">
                        <Avatar url={notif.actor?.avatar_url} name={actorName} size={44} />
                        {notifTypeBadge(notif)}
                      </div>
                      <div className="np-item-body">
                        <p className="np-item-text">{notif.body}</p>
                        <span className="np-item-time">{timeAgo(notif.created_at)}</span>
                      </div>
                      {!notif.read && <div className="np-unread-dot" />}
                      <button
                        className="np-dismiss-btn"
                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                        aria-label="Dismiss"
                      >×</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
