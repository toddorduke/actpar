import React, { useContext, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useNavSlots } from '../../context/NavSlotsContext.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useProfile } from '../../hooks/useProfile.js';
import Avatar from './Avatar.jsx';
import { timeAgoShort } from '../../utils/dateUtils.js';
import { getDisplayName } from '../../utils/displayName.js';
import './Navigation.css';

const buildClassName = ({ isActive }) => `nav-tab${isActive ? ' active' : ''}`;
const buildBottomClassName = ({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`;

function notifTypeBadge(notif) {
  if (notif.type === 'connection_request') {
    const isSpark = notif.body?.includes('sparked');
    return <span className={`notif-type-badge${isSpark ? ' spark' : ' connect'}`}>{isSpark ? '⚡' : '✓'}</span>;
  }
  if (notif.type === 'connection_accepted') return <span className="notif-type-badge connect">✓</span>;
  if (notif.type === 'streak_milestone') return <span className="notif-type-badge milestone">🔥</span>;
  return null;
}

export const NAV_POOL = {
  feed: {
    to: '/feed',
    label: 'Feed',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  connect: {
    to: '/connections',
    label: 'Connect',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  messages: {
    to: '/messages',
    label: 'Messages',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  ranks: {
    to: '/leaderboard',
    label: 'Ranks',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  tribe: {
    to: '/tribe-community',
    label: 'Tribe',
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
};

const HOME_ITEM = {
  to: '/',
  end: true,
  label: 'Home',
  icon: (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

const YOU_ITEM = {
  to: '/profile',
  label: 'Profile',
  icon: (
    <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};


const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const { slots } = useNavSlots();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileAvatarRef = useRef(null);
  const notifRef = useRef(null);
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();
  const { profile } = useProfile();

  const visibleItems = [
    HOME_ITEM,
    ...slots.map((k) => NAV_POOL[k]).filter(Boolean),
  ];

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    function handleClick(e) {
      const inDesktop = dropdownRef.current?.contains(e.target);
      const inMobile  = mobileAvatarRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) setDropdownOpen(false);
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
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
      navigate('/tribe-community');
    } else if (notif.type === 'streak_milestone' || notif.type === 'progress_complete') {
      navigate('/profile');
    } else if (notif.type === 'cheer') {
      navigate('/you');
    } else if (notif.type === 'booking_request') {
      navigate(`/messages?with=${notif.actor_id}`);
    }
  }

  const NotifList = ({ mobile }) => (
    <div className={`notif-dropdown${mobile ? ' notif-dropdown-mobile' : ''}`}>
      <div className="notif-dropdown-header">
        <span className="notif-dropdown-title">Notifications</span>
        {unreadCount > 0 && <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>}
      </div>
      {notifications.length === 0 && <div className="notif-empty">You're all caught up! 🎉</div>}
      <div className="notif-list">
        {notifications.map((notif) => {
          const actorName = notif.actor
            ? getDisplayName(notif.actor, 'Someone')
            : 'Someone';
          return (
            <div
              key={notif.id}
              className={`notif-item${notif.read ? '' : ' unread'}`}
              onClick={() => handleNotifClick(notif)}
            >
              <div className="notif-avatar-wrap">
                <Avatar url={notif.actor?.avatar_url} name={actorName} size={36} />
                {notifTypeBadge(notif)}
              </div>
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
  );

  return (
    <>
      {/* Desktop top nav */}
      <nav className="main-nav">
        <div className="nav-container">

          {/* Mobile-only avatar — top-left, same dropdown as desktop */}
          {user && (
            <div className="mobile-avatar-wrap" ref={mobileAvatarRef}>
              <button
                type="button"
                className="profile-avatar-btn"
                onClick={() => setDropdownOpen(o => !o)}
                aria-label="Account menu"
              >
                <Avatar url={profile?.avatar_url} name={profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : ''} size={34} />
              </button>
              {dropdownOpen && (
                <div className="avatar-dropdown avatar-dropdown-left">
                  <NavLink to="/profile" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </NavLink>
                  <NavLink to="/settings" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </NavLink>
                  <NavLink to="/about" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About ActPar
                  </NavLink>
                  <div className="avatar-dropdown-divider" />
                  <button type="button" className="avatar-dropdown-item danger" onClick={handleLogout}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="logo">ActPar</div>

          {/* Mobile-only icons: notifications + settings */}
          {user && (
            <div className="mobile-top-icons">
              <div className="notif-wrap">
                <button
                  type="button"
                  className="notif-btn"
                  onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
                  aria-label="Notifications"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notifOpen && <NotifList mobile />}
              </div>
              <NavLink to="/messages" className="nav-icon-btn mobile-settings-btn" aria-label="Messages">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </NavLink>
            </div>
          )}

          <div className="nav-tabs">
            {visibleItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={buildClassName}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-auth">
            {user ? (
              <>
                {/* Messages icon */}
                <NavLink to="/messages" className="nav-icon-btn" aria-label="Messages">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </NavLink>

                {/* Desktop notification bell */}
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
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  {notifOpen && <NotifList />}
                </div>

                {/* Avatar dropdown — Settings + Sign Out */}
                <div className="avatar-dropdown-wrap" ref={dropdownRef}>
                  <button
                    type="button"
                    className="profile-avatar-btn"
                    onClick={() => setDropdownOpen(o => !o)}
                    aria-label="Account menu"
                  >
                    <Avatar url={profile?.avatar_url} name={profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : ''} size={36} />
                  </button>
                  {dropdownOpen && (
                    <div className="avatar-dropdown">
                      <NavLink to="/profile" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </NavLink>
                      <NavLink to="/settings" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </NavLink>
                      <NavLink to="/about" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        About ActPar
                      </NavLink>
                      <div className="avatar-dropdown-divider" />
                      <button type="button" className="avatar-dropdown-item danger" onClick={handleLogout}>
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
              <NavLink to="/login" className="nav-signin-btn">Sign In</NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="bottom-nav">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={buildBottomClassName}>
              <span className="bottom-tab-inner">
                {item.icon}
                <span className="bottom-tab-label">{item.label}</span>
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
};

export default Navigation;
