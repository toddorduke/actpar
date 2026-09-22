import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// Mirrors client/src/components/common/Avatar.jsx's algorithm exactly
// (same COLORS palette, same name-hash) so the same person gets the same
// avatar color on both platforms -- kept mobile-local rather than shared
// since it's platform-specific UI (View/Image vs. div/img), not a hook.
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

// Props: url (optional image URL), name (used for initials + color),
// size (px, default 40). RN has no CSS gradient, so the fallback uses a
// flat solid from the same pair's first color rather than a true gradient
// -- close enough at avatar size, and avoids pulling in
// react-native-linear-gradient for this alone.
export default function Avatar({ url, name = '', size = 40, style }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const idx = getColorIndex(name);
  const [from] = COLORS[idx];
  const initials = getInitials(name);

  if (url && !imgFailed) {
    return (
      <Image
        source={{ uri: url }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: from },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
});
