import React from 'react';
import Layout from './components/common/Layout.jsx';
import { AppRoutes } from './router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConnectionsProvider } from './context/ConnectionsContext.jsx';
import { NavSlotsProvider } from './context/NavSlotsContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import { useConnectionMonitor } from './hooks/useConnectionMonitor.js';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

function AppInner() {
  useConnectionMonitor();
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <NavSlotsProvider>
          <ConnectionsProvider>
            <AppInner />
          </ConnectionsProvider>
        </NavSlotsProvider>
      </ToastProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
