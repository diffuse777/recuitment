import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

const AdminLoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  // Already authenticated as admin → dashboard
  if (user?.role === 'admin' && user?._id) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const showPopup = (message) => {
    setPopupMessage(message);
  };

  const closePopup = () => {
    setPopupMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      showPopup('Please enter both username and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        showPopup(data.message || 'Invalid username or password.');
        return;
      }

      if (!data.user || data.user.role !== 'admin' || !data.user._id || !data.token) {
        showPopup('Admin authentication failed. Please try again.');
        return;
      }

      flushSync(() => {
        login(data.user, { token: data.token, authType: 'admin' });
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      showPopup('Could not reach the server. Make sure the backend is running.');
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
        <h2 style={{ textAlign: 'center', marginBottom: '28px' }}>Admin Login</h2>

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

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
            }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>

      {popupMessage && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="login-error-title"
          onClick={closePopup}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 13, 22, 0.72)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(400px, 100%)',
              margin: 0,
              textAlign: 'center',
              borderColor: 'rgba(220, 38, 38, 0.45)',
            }}
          >
            <h3 id="login-error-title" style={{ marginBottom: '12px', color: '#f87171' }}>
              Login failed
            </h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '20px', fontSize: '0.95rem' }}>
              {popupMessage}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', minWidth: '120px' }}
              onClick={closePopup}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginPage;
