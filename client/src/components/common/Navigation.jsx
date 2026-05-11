import React, { useContext, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
import Avatar from './Avatar.jsx';
import './Navigation.css';

const buildClassName = ({ isActive }) => `nav-tab${isActive ? ' active' : ''}`;
const buildBottomClassName = ({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`;

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Profile',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/connections',
    label: 'Connect',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    to: '/tribe-community',
    label: 'Tribe',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    to: '/pact',
    label: 'Pact',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    to: '/messages',
    label: 'Messages',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

function timeAgoShort(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleNotifClick(notif) {
    markRead(notif.id);
    setNotifOpen(false);
    if (notif.type === 'connection_request' || notif.type === 'connection_accepted') {
      navigate('/connections');
    } else if (notif.type === 'pact_joined' || notif.type === 'pact_post') {
      navigate('/pact');
    } else if (notif.type === 'message') {
      navigate(`/messages?with=${notif.actor_id}`);
    } else if (notif.type === 'post_like') {
      navigate('/tribe');
    } else if (notif.type === 'streak_milestone' || notif.type === 'progress_complete') {
      navigate('/profile');
    }
  }

  return (
    <>
      {/* Desktop top nav */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="logo">ActPar</div>

          {/* Mobile-only: notification bell next to logo */}
          {user && (
            <div className="notif-wrap mobile-notif-wrap" ref={null}>
              <button
                type="button"
                className="notif-btn"
                onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
                aria-label="Notifications"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown notif-dropdown-mobile">
                  <div className="notif-dropdown-header">
                    <span className="notif-dropdown-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 && (
                    <div className="notif-empty">You're all caught up! 🎉</div>
                  )}
                  <div className="notif-list">
                    {notifications.map((notif) => {
                      const actorName = notif.actor
                        ? `${notif.actor.first_name ?? ''} ${notif.actor.last_name ?? ''}`.trim() || 'Someone'
                        : 'Someone';
                      return (
                        <div
                          key={notif.id}
                          className={`notif-item${notif.read ? '' : ' unread'}`}
                          onClick={() => handleNotifClick(notif)}
                        >
                          <Avatar url={notif.actor?.avatar_url} name={actorName} size={36} />
                          <div className="notif-item-body">
                            <p className="notif-item-text">{notif.body}</p>
                            <span className="notif-item-time">{timeAgoShort(notif.created_at)}</span>
                          </div>
                          <button
                            className="notif-item-dismiss"
                            onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                            aria-label="Dismiss"
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="nav-tabs">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={buildClassName}>
                {item.icon}
                {item.label === 'Connect' ? 'Connections' : item.label === 'Tribe' ? 'Tribe Community' : item.label === 'Pact' ? 'The Pact' : item.label === 'Messages' ? 'Messages' : item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-auth">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="notif-wrap" ref={notifRef}>
                  <button
                    type="button"
                    className="notif-btn"
                    onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
                    aria-label="Notifications"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="notif-dropdown">
                      <div className="notif-dropdown-header">
                        <span className="notif-dropdown-title">Notifications</span>
                        {unreadCount > 0 && (
                          <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                        )}
                      </div>

                      {notifications.length === 0 && (
                        <div className="notif-empty">You're all caught up! 🎉</div>
                      )}

                      <div className="notif-list">
                        {notifications.map((notif) => {
                          const actorName = notif.actor
                            ? `${notif.actor.first_name ?? ''} ${notif.actor.last_name ?? ''}`.trim() || 'Someone'
                            : 'Someone';
                          return (
                            <div
                              key={notif.id}
                              className={`notif-item${notif.read ? '' : ' unread'}`}
                              onClick={() => handleNotifClick(notif)}
                            >
                              <Avatar url={notif.actor?.avatar_url} name={actorName} size={36} />
                              <div className="notif-item-body">
                                <p className="notif-item-text">{notif.body}</p>
                                <span className="notif-item-time">{timeAgoShort(notif.created_at)}</span>
                              </div>
                              <button
                                className="notif-item-dismiss"
                                onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                                aria-label="Dismiss"
                              >×</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="avatar-dropdown-wrap" ref={dropdownRef}>
                  <button
                    type="button"
                    className="profile-avatar-btn"
                    onClick={() => setDropdownOpen(o => !o)}
                    aria-label="Account menu"
                  >
                    <div className="profile-avatar" />
                  </button>

                  {dropdownOpen && (
                    <div className="avatar-dropdown">
                      <NavLink
                        to="/settings"
                        className="avatar-dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </NavLink>
                      <NavLink
                        to="/about"
                        className="avatar-dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        About ActPar
                      </NavLink>
                      <div className="avatar-dropdown-divider" />
                      <button
                        type="button"
                        className="avatar-dropdown-item danger"
                        onClick={handleLogout}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <NavLink to="/login" className="nav-signin-btn">
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={buildBottomClassName}>
              {item.icon}
              <span className="bottom-tab-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navigation;
