import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function PageLoader({ label }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner spinner--dark" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Gate for authenticated routes. Waits for the session restore to finish
 * before deciding -- redirecting during `initializing` would bounce officers
 * to the login screen on every refresh.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <PageLoader label="Restoring your session…" />;
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/** Inverse gate: keeps signed-in officers off the login screen. */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <PageLoader label="Loading…" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
