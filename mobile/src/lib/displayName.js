// Mirrors client/src/utils/displayName.js
export function getDisplayName(profiles, fallback = 'Member') {
  if (!profiles) return fallback;
  return `${profiles.first_name ?? ''} ${profiles.last_name ?? ''}`.trim() || fallback;
}
