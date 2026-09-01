// Duration selector always shows all four options regardless of tag.
// Whichever option matches the tag's defaultDuration is always labeled
// "Recommended" (overriding its normal badge); 60 only gets "Recommended"
// when it IS the default, otherwise it shows no badge.
export const DURATION_OPTIONS = [30, 60, 90, null];

export function getDurationBadge(defaultDuration, option) {
  if (option === defaultDuration) return 'Recommended';
  if (option === 30) return 'Best for starting';
  if (option === 90) return 'Best for lasting change';
  if (option === null) return 'For daily rhythms';
  return null; // 60, when it isn't the default
}

export function durationLabel(days) {
  return days === null ? 'Ongoing' : `${days} days`;
}
