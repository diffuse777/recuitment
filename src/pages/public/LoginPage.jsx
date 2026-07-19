import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import {
  UNIVERSITY_EMAIL_DOMAIN,
  decodeGoogleCredential,
  isUniversityEmail,
} from '../../utils/auth';
import { apiUrl } from '../../config/api';

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role === 'participant' && user?._id) {
    return <Navigate to="/participant/dashboard" replace />;
  }
  // Admin sessions must use /admin/login — do not send them to the admin panel from student login
  if (user?.role === 'admin' && user?._id) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        setError('Login failed. Please try again with your university Google account.');
        return;
      }

      const decoded = decodeGoogleCredential(credential);
      const email = decoded?.email?.trim() || '';

      if (!email) {
        setError('Could not read your email from Google. Please try again.');
        return;
      }

      if (!isUniversityEmail(email)) {
        setError(
          `Only university email IDs ending with ${UNIVERSITY_EMAIL_DOMAIN} are allowed. You signed in with ${email}.`
        );
        return;
      }

      const res = await fetch(apiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed. Please use your @klu.ac.in email.');
        return;
      }

      if (!data.user?._id || !isUniversityEmail(data.user.email)) {
        setError(`Only university email IDs ending with ${UNIVERSITY_EMAIL_DOMAIN} are allowed.`);
        return;
      }

      if (data.user.role === 'admin') {
        setError('Admin accounts must sign in at the Admin Login page.');
        return;
      }

      localStorage.setItem('token', data.token);
      login(data.user);
      navigate('/participant/dashboard', { replace: true });

    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to reach the server. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="container" style={{ maxWidth: '450px', padding: '80px 24px' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Participant Login</h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginBottom: '24px',
            fontSize: '0.9rem',
          }}
        >
          Sign in with your university Google account (
          <strong>{UNIVERSITY_EMAIL_DOMAIN}</strong> only).
        </p>

        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              color: 'var(--danger, #dc2626)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            text="signin_with"
            shape="rectangular"
            theme="outline"
            size="large"
            width="320"
          />
          {loading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Signing you in…</p>
          )}
        </div>

        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          Emails outside {UNIVERSITY_EMAIL_DOMAIN} will be rejected.
        </p>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
