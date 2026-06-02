import React, { lazy, Suspense, useContext } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { AuthContext } from './context/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Route-based code splitting — each page loads only when navigated to
const ConnectionsPage    = lazy(() => import('./pages/Connections/ConnectionsPage.jsx'));
const MessagesPage       = lazy(() => import('./pages/Messages/MessagesPage.jsx'));
const UserProfilePage    = lazy(() => import('./pages/UserProfile/UserProfilePage.jsx'));
const TribeCommunityPage = lazy(() => import('./pages/TribeCommunity/TribeCommunityPage.jsx'));
const CommunityPage      = lazy(() => import('./pages/Community/CommunityPage.jsx'));
const PactPage           = lazy(() => import('./pages/Pact/PactPage.jsx'));
const HomePage           = lazy(() => import('./pages/Home/HomePage.jsx'));
const CoachProfilePage   = lazy(() => import('./pages/CoachProfile/CoachProfilePage.jsx'));
const CoachDiscoveryPage = lazy(() => import('./pages/CoachDiscovery/CoachDiscoveryPage.jsx'));
const LeaderboardPage    = lazy(() => import('./pages/Leaderboard/LeaderboardPage.jsx'));
const YouPage            = lazy(() => import('./pages/You/YouPage.jsx'));
const SettingsPage       = lazy(() => import('./pages/Settings/SettingsPage.jsx'));
const OnboardingPage     = lazy(() => import('./pages/Onboarding/OnboardingPage.jsx'));
const ProfileSetupPage   = lazy(() => import('./pages/ProfileSetup/ProfileSetupPage.jsx'));
const SignUpPage         = lazy(() => import('./pages/SignUp/SignUpPage.jsx'));
const LoginPage          = lazy(() => import('./pages/Login/LoginPage.jsx'));
const AboutPage          = lazy(() => import('./pages/About/AboutPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword/ForgotPasswordPage.jsx'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPassword/ResetPasswordPage.jsx'));
const CheckEmailPage     = lazy(() => import('./pages/CheckEmail/CheckEmailPage.jsx'));
const AdminPage          = lazy(() => import('./pages/Admin/AdminPage.jsx'));
const FeedPage           = lazy(() => import('./pages/Feed/FeedPage.jsx'));
const TribePage          = lazy(() => import('./pages/Tribe/TribePage.jsx'));
const NotificationsPage  = lazy(() => import('./pages/Notifications/NotificationsPage.jsx'));
const PostPage           = lazy(() => import('./pages/Post/PostPage.jsx'));
const NotFoundPage       = lazy(() => import('./pages/NotFound/NotFoundPage.jsx'));

// Minimal loading fallback — just keeps the screen stable while the chunk loads
const PageLoader = () => (
  <div style={{ minHeight: '100dvh', background: 'var(--color-background)' }} />
);

// Redirects already-logged-in users away from auth pages
const PublicOnlyRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/" replace /> : children;
};

export const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
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

      {/* Protected routes */}
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
  </Suspense>
);
