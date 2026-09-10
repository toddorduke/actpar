// Turns a user's own goal (or, failing that, a community's inferred
// category) into a stock-photo search query for the empty-state
// "inspiration" strip. See useInspiration.js for the fetch side.
//
// Curated per-category phrases beat the raw category word on a stock
// search -- "sobriety" itself returns almost nothing useful on Pexels,
// while "sunrise new beginning" reliably does.
const CATEGORY_QUERY = {
  faith: 'prayer candle church',
  fitness: 'gym workout training',
  sobriety: 'sunrise new beginning',
  mindfulness: 'meditation calm nature',
  nutrition: 'healthy meal fresh food',
  mental_health: 'peaceful self care',
  finance: 'budget planning savings',
  relationships: 'friends together laughing',
  learning: 'reading books study',
  career: 'office desk focus',
};

const CATEGORY_LABEL = {
  faith: 'faith',
  fitness: 'fitness',
  sobriety: 'sobriety',
  mindfulness: 'mindfulness',
  nutrition: 'nutrition',
  mental_health: 'mental health',
  finance: 'finance',
  relationships: 'relationships',
  learning: 'learning',
  career: 'career',
};

// A custom goal's title is real, specific text ("Meditation before bed",
// "Morning walk 30 min") -- good enough as a search query with light
// cleanup: drop bare numbers/units and squeeze whitespace, since a raw
// "30 min" or "10,000" token doesn't help an image search.
function cleanTitleForQuery(title) {
  return title
    .replace(/\b\d+([.,]\d+)?\s*(min(ute)?s?|hrs?|hours?|x|times?|days?|steps?)\b/gi, '')
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5)
    .join(' ');
}

// Picks the goal to draw inspiration from: highest priority tier first
// (tier 1 = most prominent, matching the Goal Pyramid), most recently
// created as the tiebreak.
function pickTopGoal(goals) {
  if (!goals?.length) return null;
  return [...goals].sort((a, b) => {
    const tierA = a.tier ?? 3;
    const tierB = b.tier ?? 3;
    if (tierA !== tierB) return tierA - tierB;
    return new Date(b.created_at) - new Date(a.created_at);
  })[0];
}

// Returns { query, label } for the inspiration strip, or null if there's
// nothing to base one on (no goals AND no recognizable community category).
export function getInspirationQuery({ goals, communityCategory } = {}) {
  const topGoal = pickTopGoal(goals);

  if (topGoal) {
    const categoryQuery = topGoal.tag && topGoal.tag !== 'custom' ? CATEGORY_QUERY[topGoal.tag] : null;
    if (categoryQuery) {
      return { query: categoryQuery, label: topGoal.title || CATEGORY_LABEL[topGoal.tag] };
    }
    const cleaned = topGoal.title ? cleanTitleForQuery(topGoal.title) : '';
    if (cleaned) {
      return { query: cleaned, label: topGoal.title };
    }
  }

  if (communityCategory && CATEGORY_QUERY[communityCategory]) {
    return { query: CATEGORY_QUERY[communityCategory], label: CATEGORY_LABEL[communityCategory] };
  }

  return null;
}
