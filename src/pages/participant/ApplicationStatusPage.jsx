import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

const MILESTONES = [
  {
    key: 'submitted',
    title: 'Application submitted',
    desc: 'Your application form has been submitted successfully.',
  },
  {
    key: 'interview',
    title: 'Interview taken',
    desc: 'Your interview has been completed.',
  },
  {
    key: 'waiting',
    title: 'Waiting for result',
    desc: 'Your application is awaiting the final decision.',
  },
  {
    key: 'finalized',
    title: 'Finalized accept or reject',
    desc: 'Your recruitment result has been finalized.',
  },
];

function getStepStates(appStatus) {
  // Not Started — nothing completed
  if (!appStatus || appStatus === 'Not Started') {
    return MILESTONES.map(() => 'pending');
  }

  // Under Review — application submitted
  if (appStatus === 'Under Review' || appStatus === 'Review') {
    return ['completed', 'pending', 'pending', 'pending'];
  }

  // Interview Done — submitted + interview taken, waiting for result
  if (appStatus === 'Interview') {
    return ['completed', 'completed', 'active', 'pending'];
  }

  // Accepted / Rejected — all prior done, finalized
  if (appStatus === 'Accepted' || appStatus === 'Rejected') {
    return ['completed', 'completed', 'completed', appStatus === 'Rejected' ? 'rejected' : 'completed'];
  }

  return ['completed', 'pending', 'pending', 'pending'];
}

function statusLabel(appStatus) {
  if (appStatus === 'Interview') return 'Interview Done';
  if (appStatus === 'Not Started') return 'Application not submitted';
  return appStatus;
}

function finalizedDetail(appStatus) {
  if (appStatus === 'Accepted') {
    return {
      title: 'Finalized — Accepted',
      desc: 'Congratulations! You have been shortlisted.',
    };
  }
  if (appStatus === 'Rejected') {
    return {
      title: 'Finalized — Rejected',
      desc: 'Your application was not selected this time.',
    };
  }
  return {
    title: 'Finalized accept or reject',
    desc: 'Your recruitment result has been finalized.',
  };
}

const ApplicationStatusPage = () => {
  const { user } = useAuth();
  const [appStatus, setAppStatus] = useState('Not Started');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/applications/my-application?userId=${user?._id || 'mockUserId'}`)
        );
        const data = await response.json();
        if (data.application) {
          setAppStatus(data.application.status);
        } else {
          setAppStatus('Not Started');
        }
      } catch (error) {
        console.error('Error fetching application status:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const stepStates = getStepStates(appStatus);
  const progressIndex =
    appStatus === 'Not Started'
      ? 0
      : appStatus === 'Under Review' || appStatus === 'Review'
        ? 1
        : appStatus === 'Interview'
          ? 2
          : 3;

  const steps = MILESTONES.map((milestone, idx) => {
    const state = stepStates[idx];
    if (milestone.key === 'finalized' && (appStatus === 'Accepted' || appStatus === 'Rejected')) {
      const detail = finalizedDetail(appStatus);
      return { ...milestone, ...detail, status: state };
    }
    if (appStatus === 'Not Started' && idx === 0) {
      return {
        ...milestone,
        title: 'Application not submitted',
        desc: 'You have not submitted your club application yet.',
        status: 'active',
      };
    }
    return { ...milestone, status: state };
  });

  // For Under Review, show application submitted as current (active visual on first step)
  if (appStatus === 'Under Review' || appStatus === 'Review') {
    steps[0].status = 'active';
  }

  const currentStep =
    appStatus === 'Not Started'
      ? {
          title: 'Application not submitted',
          desc: 'You have not submitted your club application yet.',
          status: 'active',
        }
      : steps.find((s) => s.status === 'active' || s.status === 'rejected') ||
        steps.find((s) => s.status === 'completed') ||
        steps[0];

  const badgeClass =
    appStatus === 'Accepted'
      ? 'badge-success'
      : appStatus === 'Rejected'
        ? 'badge-danger'
        : 'badge-warning';

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2>Application Progress Timeline</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Follow your recruitment journey and key event status.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              Current Milestone
            </span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '4px' }}>
              {loading ? 'Loading…' : currentStep.title}
            </h3>
          </div>
          <span
            className={`badge ${badgeClass}`}
            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
          >
            {statusLabel(appStatus)}
          </span>
        </div>

        <div
          style={{
            height: '8px',
            width: '100%',
            backgroundColor: 'var(--border-color)',
            borderRadius: '4px',
            marginBottom: '40px',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(progressIndex / (MILESTONES.length - 1)) * 100}%`,
              backgroundColor:
                appStatus === 'Rejected' ? 'var(--danger)' : 'var(--primary)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
          {steps.map((step, idx) => (
            <div key={step.key} style={{ display: 'flex', gap: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor:
                      step.status === 'completed'
                        ? 'var(--success)'
                        : step.status === 'active'
                          ? 'var(--primary)'
                          : step.status === 'rejected'
                            ? 'var(--danger)'
                            : 'var(--border-color)',
                    backgroundColor:
                      step.status === 'completed'
                        ? 'var(--success)'
                        : step.status === 'active' || step.status === 'rejected'
                          ? 'var(--card-bg)'
                          : 'var(--background-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  {step.status === 'completed' && (
                    <span style={{ color: 'white', fontSize: '0.75rem' }}>✓</span>
                  )}
                  {step.status === 'active' && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                      }}
                    />
                  )}
                  {step.status === 'rejected' && (
                    <span
                      style={{
                        color: 'var(--danger)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      ✕
                    </span>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      width: '2px',
                      flexGrow: 1,
                      backgroundColor:
                        step.status === 'completed' ? 'var(--success)' : 'var(--border-color)',
                      position: 'absolute',
                      top: '24px',
                      bottom: '-32px',
                      left: '11px',
                      zIndex: 1,
                    }}
                  />
                )}
              </div>

              <div style={{ paddingBottom: '8px' }}>
                <h4
                  style={{
                    fontSize: '1rem',
                    color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-main)',
                    fontWeight: step.status === 'active' ? '600' : '500',
                  }}
                >
                  {step.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="card"
        style={{
          backgroundColor: 'var(--primary-light)',
          borderColor: 'var(--primary)',
          borderWidth: '0 0 0 4px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>
          Need help or have questions?
        </h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          If you have questions about your application or interview, contact the board members
          directly using the Messages panel.
        </p>
      </div>
    </div>
  );
};

export default ApplicationStatusPage;
