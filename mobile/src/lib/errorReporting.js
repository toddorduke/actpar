import * as Sentry from '@sentry/react-native';

// Mirrors client/src/lib/errorReporting.js's pattern: no-op, no network
// call, until EXPO_PUBLIC_SENTRY_DSN is set to a real DSN from a Sentry
// project the user owns.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initErrorReporting() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
  });
}

export function reportError(error, context = {}) {
  if (!DSN) return;
  Sentry.captureException(error, { extra: context });
}

export function identifyUserForErrors(userId) {
  if (!DSN) return;
  Sentry.setUser(userId ? { id: userId } : null);
}
