import React from 'react';
import Layout from './components/common/Layout.jsx';
import { AppRoutes } from './router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import { useConnectionMonitor } from './hooks/useConnectionMonitor.js';

function AppInner() {
  useConnectionMonitor();
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  </AuthProvider>
);

export default App;
