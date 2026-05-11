import React from 'react';
import Layout from './components/common/Layout.jsx';
import { AppRoutes } from './router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <Layout>
        <AppRoutes />
      </Layout>
    </ToastProvider>
  </AuthProvider>
);

export default App;
