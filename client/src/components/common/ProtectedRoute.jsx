import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children, skipOnboardingCheck = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/about" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if user hasn't completed it yet
  if (!skipOnboardingCheck && !user.user_metadata?.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
