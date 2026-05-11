import React from 'react';
import './Avatar.css';

const COLORS = [
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#3b82f6', '#2563eb'],
  ['#ef4444', '#dc2626'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#06b6d4', '#0891b2'],
  ['#f97316', '#ea580c'],
];

function getColorIndex(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar component
 * - Shows avatar_url image if available
 * - Falls back to initials with a generated gradient color
 *
 * Props:
 *   url       {string}  — image URL (optional)
 *   name      {string}  — display name used for initials + color
 *   size      {number}  — px size (default 40)
 *   className {string}  — extra CSS class
 *   shape     {'circle'|'rounded'} — default 'circle'
 */
export default function Avatar({ url, name = '', size = 40, className = '', shape = 'circle' }) {
  const idx = getColorIndex(name);
  const [from, to] = COLORS[idx];
  const initials = getInitials(name);
  const borderRadius = shape === 'rounded' ? '12px' : '50%';

  const style = {
    width: size,
    height: size,
    borderRadius,
    flexShrink: 0,
    fontSize: size * 0.36,
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`ap-avatar ap-avatar-img ${className}`}
        style={style}
        onError={e => {
          // If image fails to load, swap to initials fallback
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className={`ap-avatar ap-avatar-initials ${className}`}
      style={{
        ...style,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
