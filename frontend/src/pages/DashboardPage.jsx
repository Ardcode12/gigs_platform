import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { ShieldIcon, LogOutIcon } from '../components/icons.jsx';
import { authApi } from '../api/authApi.js';
import '../styles/dashboard.css';

const EVENT_LABELS = {
  login_success: 'Signed in',
  login_failed: 'Failed sign-in attempt',
  logout: 'Signed out',
  token_refreshed: 'Session refreshed',
  password_reset_requested: 'Password reset requested',
  password_reset_completed: 'Password reset completed',
};

function formatTimestamp(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Placeholder landing screen for the authenticated area.
 *
 * The login setup is the current scope, so this only proves the session works
 * end to end and surfaces the login history the auth module records. The KPI
 * cards, society management and analytics modules from the specification
 * replace this in the next phase.
 */
export default function DashboardPage() {
  const { user, signOut, sessionTimeoutMinutes } = useAuth();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authApi
      .loginHistory()
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          <span className="shell__mark">
            <ShieldIcon width={20} height={20} />
          </span>
          <span>
            <strong>Authority Portal</strong>
            <small>Cooperative Service Marketplace</small>
          </span>
        </div>

        <div className="shell__user">
          <span className="shell__avatar" aria-hidden="true">
            {user?.fullName?.charAt(0).toUpperCase() ?? 'A'}
          </span>
          <span className="shell__identity">
            <strong>{user?.fullName}</strong>
            <small>{user?.designation ?? 'Authority Officer'}</small>
          </span>
          <Button variant="ghost" onClick={signOut}>
            <LogOutIcon width={16} height={16} />
            Sign out
          </Button>
        </div>
      </header>

      <main className="shell__main">
        <section className="panel">
          <h1 className="panel__title">Welcome, {user?.fullName?.split(' ')[0]}.</h1>
          <p className="panel__subtitle">
            Authentication is live. Governance modules land in the next phase.
          </p>

          <dl className="profile-grid">
            <div>
              <dt>Employee ID</dt>
              <dd>{user?.employeeId ?? '--'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{user?.department ?? '--'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <span className="badge badge--brand">{user?.role}</span>
              </dd>
            </div>
            <div>
              <dt>Account status</dt>
              <dd>
                <span className="badge badge--success">{user?.status}</span>
              </dd>
            </div>
            <div>
              <dt>Session timeout</dt>
              <dd>{sessionTimeoutMinutes} minutes idle</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <h2 className="panel__heading">Recent account activity</h2>
          <p className="panel__note">
            Every sign-in, sign-out and password action against your account is recorded.
          </p>

          {loadingHistory ? (
            <p className="panel__empty">Loading activity…</p>
          ) : history.length === 0 ? (
            <p className="panel__empty">No activity recorded yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">When</th>
                  <th scope="col">IP address</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className={`badge ${
                          row.event === 'login_failed' ? 'badge--danger' : 'badge--muted'
                        }`}
                      >
                        {EVENT_LABELS[row.event] ?? row.event}
                      </span>
                    </td>
                    <td>{formatTimestamp(row.created_at)}</td>
                    <td className="table__mono">{row.ip_address ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
