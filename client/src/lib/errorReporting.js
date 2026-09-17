import * as Sentry from '@sentry/react';

// Same pattern as lib/analytics.js: no-op until a real key is configured.
// Nothing is sent anywhere -- no network call, no data collection -- until
// VITE_SENTRY_DSN is set to a real DSN from a Sentry project the user owns.
const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initErrorReporting() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    // Keep this light by default -- traces/replay sampling cost quota on
    // Sentry's free tier. Bump these once there's a reason to.
    tracesSampleRate: 0.1,
  });
}

// Called from ErrorBoundary.jsx's componentDidCatch, and safe to call
// anywhere else a caught (not crashed-the-app) error is worth recording.
export function reportError(error, context = {}) {
  if (!DSN) return;
  Sentry.captureException(error, { extra: context });
}

export function identifyUserForErrors(userId) {
  if (!DSN) return;
  Sentry.setUser(userId ? { id: userId } : null);
}
