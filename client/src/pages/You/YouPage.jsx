import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useNavSlots } from '../../context/NavSlotsContext.jsx';
import { NAV_POOL } from '../../components/common/Navigation.jsx';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import './YouPage.css';

const QUICK_LINKS = [
  {
    key: 'profile',
    to: '/profile',
    emoji: '✏️',
    label: 'My Profile',
    desc: 'Edit goals, bio & photo',
  },
  {
    key: 'ranks',
    to: '/leaderboard',
    emoji: '🏆',
    label: 'Ranks',
    desc: 'See where you stand',
  },
  {
    key: 'tribe',
    to: '/tribe-community',
    emoji: '👥',
    label: 'Tribe',
    desc: 'Broader community',
  },
  {
    key: 'coaches',
    to: '/coaches',
    emoji: '🏅',
    label: 'Coaches',
    desc: 'Find a certified coach',
  },
  {
    key: 'settings',
    to: '/settings',
    emoji: '⚙️',
    label: 'Settings',
    desc: 'Notifications & account',
  },
  {
    key: 'about',
    to: '/about',
    emoji: 'ℹ️',
    label: 'About ActPar',
    desc: 'Our story & mission',
  },
];

export default function YouPage() {
  const { user, logout } = useContext(AuthContext);
  const { slots, updateSlots } = useNavSlots();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, tagline')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'You'
    : 'You';

  function toggleSlot(key) {
    if (slots.includes(key)) {
      if (slots.length <= 1) return;
      updateSlots(slots.filter((k) => k !== key));
    } else {
      if (slots.length < 3) {
        updateSlots([...slots, key]);
      } else {
        // Replace the oldest selection
        updateSlots([...slots.slice(1), key]);
      }
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="you-page">

      {/* Profile header */}
      <div className="you-profile-card">
        <Avatar url={profile?.avatar_url} name={displayName} size={68} />
        <div className="you-profile-info">
          <div className="you-profile-name">{displayName}</div>
          {profile?.tagline && (
            <div className="you-profile-tagline">"{profile.tagline}"</div>
          )}
        </div>
        <button className="you-edit-btn" onClick={() => navigate('/profile')}>
          Edit Profile
        </button>
      </div>

      {/* Quick links */}
      <div className="you-section">
        <h2 className="you-section-title">Quick Access</h2>
        <div className="you-links-grid">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.key}
              className="you-link-card"
              onClick={() => navigate(link.to)}
            >
              <span className="you-link-emoji">{link.emoji}</span>
              <span className="you-link-label">{link.label}</span>
              <span className="you-link-desc">{link.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customize nav */}
      <div className="you-section">
        <h2 className="you-section-title">Customize Your Nav</h2>
        <p className="you-section-sub">
          Pick up to 3 tabs to show between <strong>Home</strong> and <strong>You</strong>.
        </p>
        <div className="you-nav-pills">
          {Object.entries(NAV_POOL).map(([key, item]) => {
            const isActive = slots.includes(key);
            const slotNum = slots.indexOf(key) + 1;
            return (
              <button
                key={key}
                className={`you-nav-pill${isActive ? ' active' : ''}`}
                onClick={() => toggleSlot(key)}
              >
                <span className="you-nav-pill-icon">{item.icon}</span>
                <span className="you-nav-pill-label">{item.label}</span>
                {isActive && <span className="you-nav-pill-num">{slotNum}</span>}
              </button>
            );
          })}
        </div>
        <div className="you-nav-preview">
          Home &nbsp;·&nbsp;{' '}
          {slots.map((k) => NAV_POOL[k]?.label).filter(Boolean).join(' · ')}
          &nbsp;·&nbsp; You
        </div>
      </div>

      {/* Sign out */}
      <button className="you-signout-btn" onClick={handleLogout}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </div>
  );
}
