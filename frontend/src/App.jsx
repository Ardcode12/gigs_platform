import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { FederationAuthProvider } from './context/FederationAuthContext.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.jsx';
import {
  FederationProtectedRoute,
  FederationPublicOnlyRoute,
} from './components/FederationRouteGuards.jsx';
import LoginPage from './pages/LoginPage.jsx';
import FederationLoginPage from './pages/FederationLoginPage.jsx';
import FederationDashboardPage from './pages/FederationDashboardPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FederationAuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />

            {/* Reachable while signed in: an officer may follow a reset link
                from a session that is still active. */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Federation console -- its own account table, token and session. */}
            <Route
              path="/federation/login"
              element={
                <FederationPublicOnlyRoute>
                  <FederationLoginPage />
                </FederationPublicOnlyRoute>
              }
            />
            <Route
              path="/federation/dashboard"
              element={
                <FederationProtectedRoute>
                  <FederationDashboardPage />
                </FederationProtectedRoute>
              }
            />
            <Route path="/federation" element={<Navigate to="/federation/dashboard" replace />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </FederationAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
