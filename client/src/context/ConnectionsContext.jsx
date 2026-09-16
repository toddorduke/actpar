import React, { createContext, useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { useConnections as useConnectionsShared } from '@actpar/shared';
import { track, Events } from '../lib/analytics.js';
import { playSparkSound } from '../utils/sounds.js';

// Thin wrapper: the actual logic (fetching, matching, spark/accept/decline)
// lives in @actpar/shared now, shared with mobile. This stays as a Context
// provider purely so every existing useContext(ConnectionsContext) call
// site across the app keeps working unchanged -- and to wire in the two
// web-only side effects (posthog tracking, the Web Audio spark sound) that
// don't belong in shared, platform-agnostic code.
export const ConnectionsContext = createContext(null);

export const ConnectionsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const connections = useConnectionsShared(user?.id, {
    onSparkSent: (hasMessage) => {
      track(Events.SPARK_SENT, { has_message: hasMessage });
      playSparkSound();
    },
    onSparkAccepted: () => track(Events.SPARK_ACCEPTED),
  });

  return (
    <ConnectionsContext.Provider value={connections}>
      {children}
    </ConnectionsContext.Provider>
  );
};
