import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

const AdminLoginPage = () => {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  // Already authenticated as admin → dashboard
  if (user?.role === 'admin' && user?._id) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Please enter both username and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid admin credentials.');
        return;
      }

      if (!data.user || data.user.role !== 'admin' || !data.user._id) {
        setError('Admin authentication failed. Please try again.');
        return;
      }

      // Replace any existing participant session with the admin session
      logout();
      localStorage.setItem('token', data.token);
      localStorage.setItem('authType', 'admin');
      login(data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Could not reach the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', padding: '80px 24px' }}>
      <div className="card" style={{ borderColor: 'var(--sidebar-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '2.5rem' }}>🛠️</span>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Admin Login</h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginBottom: '28px',
            fontSize: '0.9rem',
          }}
        >
          Separate administrator access only. Participants must use the student login page.
        </p>

        {user?.role === 'participant' && (
          <div
            style={{
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              color: 'var(--warning, #d97706)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '0.88rem',
            }}
          >
            You are signed in as a participant. Admin credentials are required to access the admin
            panel.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Admin Username
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Admin username"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="password">
              Admin Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.35)',
                color: 'var(--danger, #dc2626)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', backgroundColor: 'var(--sidebar-bg)' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Login as Admin'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Participant login →
          </Link>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to public website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
