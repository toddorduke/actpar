// Communities have no stored category -- this infers one from the name/
// description using the same taxonomy goals and the Leaderboard already
// use (CATEGORY_META in LeaderboardPage.jsx), so a community's cover
// placeholder shows a topic-relevant icon instead of one hardcoded emoji
// for every community regardless of what it's actually about.
const CATEGORY_KEYWORDS = [
  ['faith', ['faith', 'church', 'god', 'pray', 'bible', 'worship', 'christian', 'spiritual', 'ministry']],
  ['fitness', ['fitness', 'gym', 'workout', 'exercise', 'run', 'running', 'training', 'lift', 'lifting', 'muscle', 'cardio', 'crossfit']],
  ['sobriety', ['sober', 'sobriety', 'recovery', 'addiction', 'clean', 'quit']],
  ['mindfulness', ['mindful', 'meditat', 'yoga', 'calm', 'breathe', 'breathwork']],
  ['nutrition', ['nutrition', 'diet', 'meal', 'cooking', 'healthy eating']],
  ['mental_health', ['mental health', 'therapy', 'anxiety', 'depression', 'self-care', 'self care', 'healing']],
  ['finance', ['finance', 'money', 'budget', 'invest', 'debt', 'saving', 'wealth', 'financial']],
  ['relationships', ['relationship', 'dating', 'marriage', 'family', 'friendship']],
  ['learning', ['learn', 'reading', 'book club', 'study', 'education', 'skill']],
  ['career', ['career', 'entrepreneur', 'business', 'professional', 'networking']],
];

export const CATEGORY_EMOJI = {
  faith: '✝️',
  fitness: '💪',
  sobriety: '🌱',
  mindfulness: '🧘',
  nutrition: '🥗',
  mental_health: '🧠',
  finance: '💰',
  relationships: '❤️',
  learning: '📚',
  career: '💼',
  other: '✨',
};

export function guessCommunityCategory(name = '', description = '') {
  const text = `${name} ${description}`.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) return category;
  }
  return 'other';
}

export function guessCommunityEmoji(name, description) {
  return CATEGORY_EMOJI[guessCommunityCategory(name, description)];
}
