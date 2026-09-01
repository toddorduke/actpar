// InterestTag values, per-category defaults, and disclaimers for the goal
// system. This file didn't exist in the repo -- drafted from the "ActPac
// Goal System Spec" based on what each category's defaults/copy imply.

export const INTEREST_TAGS = [
  'fitness',
  'nutrition',
  'finance',
  'productivity',
  'mindfulness',
  'career',
  'relationships',
  'faith',
];

export const INTEREST_CONFIG = {
  fitness: {
    label: 'Fitness',
    defaultFrequency: 'daily',
    defaultDuration: 60,
    durationHint: 'Most people see real change by week six — that\'s why 60 is the default.',
    disclaimer: 'This app is not a substitute for professional medical or fitness advice. Talk to a doctor before starting a new exercise program.',
  },
  nutrition: {
    label: 'Nutrition',
    defaultFrequency: 'daily',
    defaultDuration: 30,
    durationHint: 'Start with 30 days to build the habit before committing longer.',
    disclaimer: 'Nutrition content here is informational only, not medical or dietary advice. Talk to a registered dietitian or doctor about your specific needs.',
  },
  finance: {
    label: 'Finance',
    defaultFrequency: 'weekly',
    defaultDuration: 90,
    durationHint: 'Financial habits take longer to compound — 90 days gives it real runway.',
    disclaimer: 'This is not financial advice. Talk to a licensed financial professional before making financial decisions.',
  },
  productivity: {
    label: 'Productivity',
    defaultFrequency: 'daily',
    defaultDuration: 30,
    durationHint: 'Productivity systems are easiest to test in a focused 30-day sprint.',
    disclaimer: null,
  },
  mindfulness: {
    label: 'Mindfulness',
    defaultFrequency: 'daily',
    defaultDuration: 60,
    durationHint: 'The benefits tend to compound — 60 days is usually enough to feel it stick.',
    disclaimer: 'This app is not a substitute for professional mental health care. If you\'re in crisis, please reach out to a licensed professional or a crisis line.',
  },
  career: {
    label: 'Career',
    defaultFrequency: '3x_week',
    defaultDuration: 90,
    durationHint: 'Career goals rarely move in a month — 90 days matches how job searches and skill-building actually play out.',
    disclaimer: null,
  },
  relationships: {
    label: 'Relationships',
    defaultFrequency: 'weekly',
    defaultDuration: null,
    durationHint: 'Relationships aren\'t a sprint — this one\'s built to run indefinitely.',
    disclaimer: null,
  },
  faith: {
    label: 'Faith',
    defaultFrequency: 'daily',
    defaultDuration: null,
    durationHint: 'A daily practice you keep going, not a program with an end date.',
    disclaimer: null,
  },
};

// Tags whose disclaimer must be shown near goal creation and near content,
// per spec section 7.
export const DISCLAIMER_TAGS = ['fitness', 'nutrition', 'finance', 'mindfulness'];

export const CUSTOM_TAG_DEFAULTS = {
  defaultFrequency: 'daily',
  defaultDuration: 30,
};
