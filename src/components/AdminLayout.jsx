import React from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects all admin dashboard routes.
 * - Unauthenticated users → /admin/login
 * - Participants → blocked (sent back to participant dashboard)
 * - Admins only → allowed
 */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user?._id) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/participant/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
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
            Club Administrator
          </span>
        </div>

        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          📊 Dashboard
        </NavLink>
        <NavLink
          to="/admin/applicants"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          👥 Applicants
        </NavLink>
        <NavLink
          to="/admin/messages"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          💬 Messages
        </NavLink>
        <NavLink
          to="/admin/export"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          📥 Export Data
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
        >
          ⚙️ Recruitment Settings
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

export default AdminLayout;
