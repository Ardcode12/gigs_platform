import React, { useState, useEffect } from 'react';
import PortalSelector from './pages/PortalSelector';
import SocietyApp from './pages/society/SocietyApp';

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
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('gm_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  if (!session) return <PortalSelector onLogin={handleLogin} />;
  if (session.role === 'society') return <SocietyApp session={session} onLogout={handleLogout} />;
  return <ComingSoon role={session.role} onLogout={handleLogout} />;
};

export default App;
