import React, { useEffect } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUniversityEmail } from '../utils/auth';

/**
 * Protects participant dashboard routes only.
 * Admins hitting participant URLs are sent to the admin dashboard.
 */
const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const invalidParticipant =
    !!user && user.role === 'participant' && !isUniversityEmail(user.email);

  useEffect(() => {
    if (invalidParticipant) logout();
  }, [invalidParticipant, logout]);

  if (!user || typeof user !== 'object' || !user._id || !user.role || invalidParticipant) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Admins use /admin/* only — keep them off participant routes (and not bounced into admin from public CTAs)
  if (user.role === 'admin') {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'participant') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '0 12px 16px 12px', borderBottom: '1px solid #1e293b', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            Logged in as
          </span>
          <div
            style={{
              color: 'white',
              fontWeight: '600',
              fontSize: '0.95rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.name || user.email}
          </div>
          <span className="badge badge-primary" style={{ marginTop: '8px', fontSize: '0.7rem' }}>
            Applicant
          </span>
        </div>

        <NavLink
          to="/participant/dashboard"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          📊 Dashboard
        </NavLink>
        <NavLink
          to="/participant/apply"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          📝 Apply Now
        </NavLink>
        <NavLink
          to="/participant/status"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          ⏳ Application Status
        </NavLink>
        <NavLink
          to="/participant/messages"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          💬 Messages
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          🚪 Logout
        </button>
      </aside>

      <main className="content-pane">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
