import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../config/api';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(apiUrl('/api/applications'));
        const data = await response.json();
        setApplications(data.applications || []);
      } catch (error) {
        console.error('Error fetching applications for dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const total = applications.length;
  const pending = applications.filter(app => app.status === 'Under Review' || app.status === 'Review').length;
  const interviewing = applications.filter(app => app.status === 'Interview').length;
  const accepted = applications.filter(app => app.status === 'Accepted').length;
  const recent = [...applications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3);
  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <div>
          <h2>Admin Dashboard Overview</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor club applicant metrics, updates, and schedule management.</p>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Applications
          </span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--primary)' }}>{loading ? '-' : total}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>Total submitted</p>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Pending Review
          </span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--warning)' }}>{loading ? '-' : pending}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting evaluation</p>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Interview Done
          </span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--primary)' }}>{loading ? '-' : interviewing}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting accept / reject</p>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Offers Accepted
          </span>
          <h2 style={{ fontSize: '2.25rem', marginTop: '8px', color: 'var(--success)' }}>{loading ? '-' : accepted}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>Target: 15 members</p>
        </div>
      </div>

      <div className="grid-cols-2" style={{ alignItems: 'start' }}>
        {/* Recent Applicants summary */}
        <div className="card" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Signups</h3>
            <Link to="/admin/applicants" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
              View All
            </Link>
          </div>
          
          <table className="table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Major</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : recent.length > 0 ? (
                recent.map(app => (
                  <tr key={app._id}>
                    <td>{app.name}</td>
                    <td>{app.department}</td>
                    <td>
                      <span className={`badge ${
                        app.status === 'Accepted' ? 'badge-success' : 
                        (app.status === 'Under Review' || app.status === 'Review') ? 'badge-warning' : 
                        app.status === 'Interview' ? 'badge-primary' : 
                        'badge-danger'
                      }`}>
                        {app.status === 'Interview' ? 'Interview Done' : app.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent signups.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Notifications and tasks */}
        <div className="card">
          <h3 className="card-title">Administrative Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/admin/applicants" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              📝 Review Pending Submissions
            </Link>
            <Link to="/admin/messages" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              💬 Open Recruitment Chat Inboxes
            </Link>
            <Link to="/admin/export" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              📥 Export Applicants (CSV / Excel / PDF)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
