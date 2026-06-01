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
import HomePage from './pages/Home/HomePage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import CoachProfilePage from './pages/CoachProfile/CoachProfilePage.jsx';
import CoachDiscoveryPage from './pages/CoachDiscovery/CoachDiscoveryPage.jsx';
import LeaderboardPage from './pages/Leaderboard/LeaderboardPage.jsx';
import YouPage from './pages/You/YouPage.jsx';
import SettingsPage from './pages/Settings/SettingsPage.jsx';
import OnboardingPage from './pages/Onboarding/OnboardingPage.jsx';
import ProfileSetupPage from './pages/ProfileSetup/ProfileSetupPage.jsx';
import SignUpPage from './pages/SignUp/SignUpPage.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import AboutPage from './pages/About/AboutPage.jsx';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage.jsx';
import CheckEmailPage from './pages/CheckEmail/CheckEmailPage.jsx';
import AdminPage from './pages/Admin/AdminPage.jsx';
import FeedPage from './pages/Feed/FeedPage.jsx';
import TribePage from './pages/Tribe/TribePage.jsx';
import NotificationsPage from './pages/Notifications/NotificationsPage.jsx';
import PostPage from './pages/Post/PostPage.jsx';
import NotFoundPage from './pages/NotFound/NotFoundPage.jsx';

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
    <Route path="/check-email" element={<CheckEmailPage />} />

    {/* Onboarding — skips both gates to avoid redirect loops */}
    <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck skipProfileSetupCheck><OnboardingPage /></ProtectedRoute>} />

    {/* Profile setup — onboarding must be done first, but skips the profile gate */}
    <Route path="/profile-setup" element={<ProtectedRoute skipProfileSetupCheck><ProfileSetupPage /></ProtectedRoute>} />

    {/* Protected routes — redirect to /login if not authenticated, /onboarding if not complete */}
    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
    <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
    <Route path="/tribe-community" element={<ProtectedRoute><TribeCommunityPage /></ProtectedRoute>} />
    <Route path="/community/:id" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
    <Route path="/pact" element={<ProtectedRoute><PactPage /></ProtectedRoute>} />
    <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
    <Route path="/profile/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
    <Route path="/coaches" element={<ProtectedRoute><CoachDiscoveryPage /></ProtectedRoute>} />
    <Route path="/coach/:coachId" element={<ProtectedRoute><CoachProfilePage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
    <Route path="/you" element={<ProtectedRoute><YouPage /></ProtectedRoute>} />
    <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="/post/:id" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
    <Route path="/tribe" element={<ProtectedRoute><TribePage /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
