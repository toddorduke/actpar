import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useNavSlots } from '../../context/NavSlotsContext.jsx';
import { NAV_POOL } from '../../components/common/Navigation.jsx';
import { getDisplayName } from '../../utils/displayName.js';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import './YouPage.css';

const QUICK_LINKS = [
  {
    key: 'profile',
    to: '/',
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
    ? getDisplayName(profile, 'You')
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
        <button className="you-edit-btn" onClick={() => navigate('/')}>
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
