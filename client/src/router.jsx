import React, { useContext } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ConnectionsPage from './pages/Connections/ConnectionsPage.jsx';
import MessagesPage from './pages/Messages/MessagesPage.jsx';
import UserProfilePage from './pages/UserProfile/UserProfilePage.jsx';
import TribeCommunityPage from './pages/TribeCommunity/TribeCommunityPage.jsx';
import CommunityPage from './pages/Community/CommunityPage.jsx';
import PactPage from './pages/Pact/PactPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import CoachProfilePage from './pages/CoachProfile/CoachProfilePage.jsx';
import CoachDiscoveryPage from './pages/CoachDiscovery/CoachDiscoveryPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';
import OnboardingPage from './pages/Onboarding/OnboardingPage.jsx';
import ProfileSetupPage from './pages/ProfileSetup/ProfileSetupPage.jsx';
import SignUpPage from './pages/SignUp/SignUpPage.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import AboutPage from './pages/About/AboutPage.jsx';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage.jsx';

// Redirects already-logged-in users away from auth pages
const PublicOnlyRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/" replace /> : children;
};

export const AppRoutes = () => (
  <Routes>
    {/* Public-only routes — redirect to home if already logged in */}
    <Route path="/about" element={<AboutPage />} />
    <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    <Route path="/signup" element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />
    <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Onboarding — skips both gates to avoid redirect loops */}
    <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck skipProfileSetupCheck><OnboardingPage /></ProtectedRoute>} />

    {/* Profile setup — onboarding must be done first, but skips the profile gate */}
    <Route path="/profile-setup" element={<ProtectedRoute skipProfileSetupCheck><ProfileSetupPage /></ProtectedRoute>} />

    {/* Protected routes — redirect to /login if not authenticated, /onboarding if not complete */}
    <Route path="/" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
    <Route path="/tribe-community" element={<ProtectedRoute><TribeCommunityPage /></ProtectedRoute>} />
    <Route path="/community/:id" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
    <Route path="/pact" element={<ProtectedRoute><PactPage /></ProtectedRoute>} />
    <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
    <Route path="/profile/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
    <Route path="/coaches" element={<ProtectedRoute><CoachDiscoveryPage /></ProtectedRoute>} />
    <Route path="/coach/:coachId" element={<ProtectedRoute><CoachProfilePage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
  </Routes>
);
