import React, { useState, useEffect } from 'react';
import PortalSelector from './pages/PortalSelector';
import SocietyApp from './pages/society/SocietyApp';

import { authAPI } from './services/api';

// Worker & Customer portals are built separately by other team members
const ComingSoon = ({ role, onLogout }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: 16 }}>
    <div style={{ fontSize: 64 }}>{role === 'worker' ? '🔧' : '📱'}</div>
    <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>{role === 'worker' ? 'Worker' : 'Customer'} Portal</h2>
    <p style={{ color: 'var(--text-muted)', margin: 0 }}>This portal is being built by another team. Coming soon.</p>
    <button className="btn btn-primary" onClick={onLogout} style={{ marginTop: 8 }}>← Back to Portal Selector</button>
  </div>
);

const App = () => {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Validate session against server on startup
  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('gm_token');
      const savedSession = localStorage.getItem('gm_session');
      if (!savedToken || !savedSession) {
        setSession(null);
        setInitializing(false);
        return;
      }

      try {
        const parsed = JSON.parse(savedSession);
        const res = await authAPI.getMe();
        if (res.data?.success) {
          setSession(parsed);
        } else {
          handleLogout();
        }
      } catch (err) {
        // Token is invalid, expired, or server rejected
        handleLogout();
      } finally {
        setInitializing(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLogin = (role, token, data) => {
    const sess = { role, token, data };
    localStorage.setItem('gm_token', token);
    localStorage.setItem('gm_session', JSON.stringify(sess));
    setSession(sess);
  };

  const handleLogout = () => {
    localStorage.removeItem('gm_token');
    localStorage.removeItem('gm_session');
    setSession(null);
  };

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!session) return <PortalSelector onLogin={handleLogin} />;
  if (session.role === 'society') return <SocietyApp session={session} onLogout={handleLogout} />;
  return <ComingSoon role={session.role} onLogout={handleLogout} />;
};

export default App;
