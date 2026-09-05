import React, { useState } from 'react';
import { Zap } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [societyId, setSocietyId] = useState('SOC-TN-CHE-01');
  const [password, setPassword] = useState('society123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    if (societyId === 'SOC-TN-CHE-01' && password === 'society123') {
      localStorage.setItem('society_token', 'demo_token_abc123');
      localStorage.setItem('society_info', JSON.stringify({ id: societyId, name: 'Chennai Central Gig Society' }));
      onLogin();
    } else {
      setError('Invalid Society ID or password. Use SOC-TN-CHE-01 / society123');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card slide-in">
        <div className="login-logo">
          <div className="login-logo-icon">G</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>GigMat</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Society Dashboard</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Society Login</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Use your Federation-issued Society ID to sign in</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <Zap size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Society ID</label>
            <input
              className="form-input"
              placeholder="e.g. SOC-TN-CHE-01"
              value={societyId}
              onChange={e => setSocietyId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, borderRadius: 12, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying...</> : 'Sign In to Dashboard'}
          </button>
        </form>

        <p className="login-footer-text">
          🔒 Secured by GigMat Federation Platform · SIH 2026
        </p>

        <div className="alert alert-info" style={{ marginTop: 16, fontSize: 12 }}>
          <strong>Demo:</strong> ID: SOC-TN-CHE-01 &nbsp;|&nbsp; Password: society123
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
