import { Navigate, useLocation } from 'react-router-dom';
import { useFederationAuth } from '../context/FederationAuthContext.jsx';

function PageLoader({ label }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner spinner--dark" />
      <span>{label}</span>
    </div>
  );
}

/** Gate for the federation console. Waits for the session restore to settle. */
export function FederationProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useFederationAuth();
  const location = useLocation();

  if (initializing) {
    return <PageLoader label="Restoring your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/federation/login" state={{ from: location }} replace />;
  }

  return children;
}

/** Inverse gate: keeps signed-in federation admins off their login screen. */
export function FederationPublicOnlyRoute({ children }) {
  const { isAuthenticated, initializing } = useFederationAuth();

  if (initializing) {
    return <PageLoader label="Loading…" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/federation/dashboard" replace />;
  }

  return children;
}
