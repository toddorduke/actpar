import posthog from 'posthog-js';

const KEY  = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export function initAnalytics() {
  if (!KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // we fire events manually so data is clean
  });
}

export function identifyUser(userId, traits = {}) {
  if (!KEY) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (!KEY) return;
  posthog.reset();
}

export function track(event, props = {}) {
  if (!KEY) return;
  posthog.capture(event, props);
}

// ── Named events ─────────────────────────────────────────────
// Onboarding
export const Events = {
  // Onboarding
  ONBOARDING_STARTED:       'onboarding_started',
  ONBOARDING_STEP:          'onboarding_step_completed',   // { step, mode }
  ONBOARDING_COMPLETED:     'onboarding_completed',        // { mode }

  // Profile setup
  PROFILE_SETUP_STEP:       'profile_setup_step',          // { step }
  PROFILE_SETUP_COMPLETED:  'profile_setup_completed',

  // Goals
  GOAL_CREATED:             'goal_created',                // { tier, category }
  GOAL_CHECKED_IN:          'goal_checked_in',             // { day_count }
  GOAL_COMPLETED:           'goal_completed',
  GOAL_DELETED:             'goal_deleted',

  // Connections
  SPARK_SENT:               'spark_sent',
  SPARK_ACCEPTED:           'spark_accepted',
  CONNECTION_VIEWED:        'connection_profile_viewed',

  // Journeys
  JOURNEY_PROPOSED:         'journey_proposed',
  JOURNEY_ACCEPTED:         'journey_accepted',
  JOURNEY_GOAL_LINKED:      'journey_goal_linked',

  // Posts
  POST_CREATED:             'post_created',                // { post_type }
  POST_LIKED:               'post_liked',
  POST_COMMENTED:           'post_commented',

  // Communities
  COMMUNITY_JOINED:         'community_joined',
  COMMUNITY_CREATED:        'community_created',
  COMMUNITY_OPENED:         'community_opened',

  // Messages
  MESSAGE_SENT:             'message_sent',

  // Referral
  REFERRAL_LINK_COPIED:     'referral_link_copied',
  REFERRAL_SHARED:          'referral_shared',

  // App tour
  TOUR_STARTED:             'tour_started',                // { type }
  TOUR_COMPLETED:           'tour_completed',
  TOUR_SKIPPED:             'tour_skipped',                // { slide }

  // Retention
  PUSH_ENABLED:             'push_notifications_enabled',
  PUSH_DISABLED:            'push_notifications_disabled',
};
