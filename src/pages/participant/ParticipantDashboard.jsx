import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

function deriveStatuses(application) {
  if (!application) {
    return {
      applied: false,
      applicationStatus: 'Application not submitted',
      interviewStatus: 'Not scheduled',
      shortlistStatus: 'Not shortlisted',
    };
  }

  const status = application.status || 'Under Review';

  switch (status) {
    case 'Interview':
      return {
        applied: true,
        applicationStatus: 'Interview Done',
        interviewStatus: 'Interview Done',
        shortlistStatus: 'Awaiting decision',
      };
    case 'Accepted':
      return {
        applied: true,
        applicationStatus: 'Accepted',
        interviewStatus: 'Interview Done',
        shortlistStatus: 'Shortlisted',
      };
    case 'Rejected':
      return {
        applied: true,
        applicationStatus: 'Rejected',
        interviewStatus: 'Interview Done',
        shortlistStatus: 'Not shortlisted',
      };
    case 'Under Review':
    default:
      return {
        applied: true,
        applicationStatus: 'Under Review',
        interviewStatus: 'Pending',
        shortlistStatus: 'Under review',
      };
  }
}

function statusBadgeClass(label) {
  const value = (label || '').toLowerCase();
  if (value.includes('accepted') || value.includes('shortlisted') || value.includes('completed') || value.includes('invited')) {
    return 'badge-success';
  }
  if (value.includes('rejected') || value.includes('not shortlisted') || value.includes('not submitted')) {
    return 'badge-danger';
  }
  if (value.includes('pending') || value.includes('under review') || value.includes('not scheduled')) {
    return 'badge-warning';
  }
  return 'badge-primary';
}

const statusCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minHeight: '120px',
};

const ParticipantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState(() => deriveStatuses(null));

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const response = await fetch(
          apiUrl(`/api/applications/my-application?userId=${encodeURIComponent(user._id)}`)
        );
        const data = await response.json();
        setStatuses(deriveStatuses(data.application || null));
      } catch (error) {
        console.error('Error fetching application status:', error);
        setStatuses(deriveStatuses(null));
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="container" style={{ padding: '28px 20px', maxWidth: '960px' }}>
      <header style={{ marginBottom: '28px' }}>
        <h2 style={{ marginBottom: '8px' }}>
          Welcome, {user?.name || 'Participant'}
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          University email:{' '}
          <strong style={{ color: 'var(--text-main)' }}>{user?.email || '—'}</strong>
        </p>
      </header>

      {!loading && !statuses.applied && (
        <div
          className="card"
          style={{
            marginBottom: '24px',
            borderColor: 'rgba(217, 119, 6, 0.35)',
            backgroundColor: 'var(--warning-light)',
          }}
        >
          <h3 className="card-title" style={{ marginBottom: '8px' }}>
            Application not submitted
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.92rem' }}>
            You have not submitted your club application yet. Start now to join the recruitment process.
          </p>
          <Link to="/participant/apply" className="btn btn-primary">
            Apply Now
          </Link>
        </div>
      )}

      <div
        className="participant-status-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={statusCardStyle}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            Application status
          </span>
          {loading ? (
            <span className="badge badge-secondary">Loading…</span>
          ) : (
            <span className={`badge ${statusBadgeClass(statuses.applicationStatus)}`}>
              {statuses.applicationStatus}
            </span>
          )}
        </div>

        <div className="card" style={statusCardStyle}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            Interview status
          </span>
          {loading ? (
            <span className="badge badge-secondary">Loading…</span>
          ) : (
            <span className={`badge ${statusBadgeClass(statuses.interviewStatus)}`}>
              {statuses.interviewStatus}
            </span>
          )}
        </div>

        <div className="card" style={statusCardStyle}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            Shortlist status
          </span>
          {loading ? (
            <span className="badge badge-secondary">Loading…</span>
          ) : (
            <span className={`badge ${statusBadgeClass(statuses.shortlistStatus)}`}>
              {statuses.shortlistStatus}
            </span>
          )}
        </div>
      </div>

      <div
        className="participant-actions"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {statuses.applied ? (
          <button
            type="button"
            className="btn btn-secondary"
            disabled
            title="You have already submitted an application"
            style={{ opacity: 0.55, cursor: 'not-allowed' }}
          >
            Apply Now
          </button>
        ) : (
          <Link to="/participant/apply" className="btn btn-primary">
            Apply Now
          </Link>
        )}

        <Link to="/participant/status" className="btn btn-secondary">
          Interview / Application Status
        </Link>

        <Link to="/participant/messages" className="btn btn-secondary">
          Messages
        </Link>

        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .participant-status-grid {
            grid-template-columns: 1fr !important;
          }
          .participant-actions {
            flex-direction: column;
          }
          .participant-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticipantDashboard;
