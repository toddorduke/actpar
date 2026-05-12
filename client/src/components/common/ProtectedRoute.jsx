import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

const ProtectedRoute = ({ children, skipOnboardingCheck = false, skipProfileSetupCheck = false }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/about" state={{ from: location }} replace />;
  }

  if (!skipOnboardingCheck && !user.user_metadata?.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!skipProfileSetupCheck && user.user_metadata?.onboarding_complete && !user.user_metadata?.profile_setup_complete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;
