import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cybernerdsLogo from '../assets/cybernerds.png';
import owaspLogo from '../assets/owasp.png';
import kalasalingamLogo from '../assets/kalasalingam.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            textDecoration: 'none',
            flexWrap: 'nowrap',
          }}
        >
          <img
            src={cybernerdsLogo}
            alt="Cybernerds KARE Student Chapter"
            style={{
              height: '38px',
              minWidth: '120px',
              maxWidth: '160px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--border-strong)',
              flexShrink: 0,
            }}
          />
          <img
            src={owaspLogo}
            alt="OWASP KARE Student Chapter"
            style={{
              height: '38px',
              minWidth: '120px',
              maxWidth: '160px',
              objectFit: 'contain',
              filter: 'invert(1)',
              display: 'block',
            }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>
          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: '600', whiteSpace: 'nowrap' }}
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
              style={{ fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Sign In
            </Link>
          )}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--border-strong)',
              flexShrink: 0,
            }}
          />
          <img
            src={kalasalingamLogo}
            alt="Kalasalingam Academy of Research and Education"
            style={{
              height: '56px',
              width: 'auto',
              objectFit: 'contain',
              flexShrink: 0,
              display: 'block',
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
