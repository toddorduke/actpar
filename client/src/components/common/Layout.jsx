import React from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './Navigation.jsx';
import AppGuide from './AppGuide.jsx';

const AUTH_ROUTES = ['/login', '/signup', '/onboarding', '/forgot-password', '/reset-password'];

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  return (
    <div className="app-shell">
      {!isAuthPage && <Navigation />}
      <main className={isAuthPage ? 'app-main-full' : 'app-main'}>
        {children}
      </main>
      {!isAuthPage && <AppGuide />}
    </div>
  );
};

export default Layout;
