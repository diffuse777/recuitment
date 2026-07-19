import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../socket';
import { fileToBase64, viewApplicationResume } from '../../utils/resume';
import { apiUrl } from '../../config/api';

const detailRowStyle = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  gap: '8px 16px',
  padding: '10px 0',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '0.92rem',
};

const DetailRow = ({ label, value }) => (
  <div style={detailRowStyle}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    <span style={{ fontWeight: 500 }}>{value || '—'}</span>
  </div>
);

const ApplicantsPage = () => {
  const { user: adminUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [resumeStatus, setResumeStatus] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);
  const [remarksApp, setRemarksApp] = useState(null);
  const [remarksDraft, setRemarksDraft] = useState('');
  const [remarksStatus, setRemarksStatus] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);

  const fetchApplicants = async () => {
    try {
      const response = await fetch(apiUrl('/api/applications'));
      const data = await response.json();
      setApplicants(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  useEffect(() => {
    if (!adminUser?._id) return;
    socket.connect();
    socket.emit('join_room', adminUser._id);
    return () => {
      socket.disconnect();
    };
  }, [adminUser]);

  const filteredApplicants = applicants.filter((app) => {
    const statusMap = {
      'under review': 'review',
      interview: 'interview',
      accepted: 'accepted',
      rejected: 'rejected',
    };
    const normalizedStatus = statusMap[app.status?.toLowerCase()] || app.status?.toLowerCase();
    const matchesFilter = filter === 'all' || normalizedStatus === filter;
    const matchesSearch =
      app.name?.toLowerCase().includes(search.toLowerCase()) ||
      app.department?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openDetails = (app) => {
    setSelectedApp(app);
    setMessageText('');
    setMessageStatus('');
    setResumeStatus('');
    setResumeKey((k) => k + 1);
  };

  const closeDetails = () => {
    setSelectedApp(null);
    setMessageText('');
    setMessageStatus('');
    setResumeStatus('');
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(apiUrl(`/api/applications/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.application) {
        setApplicants((prev) =>
          prev.map((a) => (a._id === id ? data.application : a))
        );
        setSelectedApp((prev) => (prev?._id === id ? data.application : prev));
        setRemarksApp((prev) => (prev?._id === id ? data.application : prev));
      }
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const openRemarks = (app) => {
    setRemarksApp(app);
    setRemarksDraft(app.remarks || '');
    setRemarksStatus('');
  };

  const closeRemarks = () => {
    setRemarksApp(null);
    setRemarksDraft('');
    setRemarksStatus('');
  };

  const saveRemarks = async () => {
    if (!remarksApp?._id) return;
    setSavingRemarks(true);
    setRemarksStatus('');
    try {
      const res = await fetch(apiUrl(`/api/applications/${remarksApp._id}/remarks`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarksDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRemarksStatus(data.message || 'Failed to save remarks.');
        return;
      }
      if (data.application) {
        setApplicants((prev) =>
          prev.map((a) => (a._id === data.application._id ? data.application : a))
        );
        setSelectedApp((prev) =>
          prev?._id === data.application._id ? data.application : prev
        );
        setRemarksApp(data.application);
        setRemarksDraft(data.application.remarks || '');
        setRemarksStatus('Remarks saved.');
      }
    } catch (error) {
      console.error('Save remarks failed:', error);
      setRemarksStatus('Failed to save remarks.');
    } finally {
      setSavingRemarks(false);
    }
  };

  const handleDelete = async (app) => {
    if (!app?._id) return;
    const confirmed = window.confirm(
      `Delete applicant "${app.name}"?\n\nThis will permanently remove their application, messages, and user account.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`/api/applications/${app._id}`), {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to delete applicant.');
        return;
      }
      setApplicants((prev) => prev.filter((a) => a._id !== app._id));
      if (selectedApp?._id === app._id) closeDetails();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete applicant.');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewResume = async (appId) => {
    try {
      setResumeStatus('');
      await viewApplicationResume(appId);
    } catch (error) {
      setResumeStatus(error.message || 'Could not open resume.');
      alert(error.message || 'Could not open resume. Please upload the PDF first.');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedApp?._id) return;

    if (file.type !== 'application/pdf') {
      setResumeStatus('Only PDF files are allowed.');
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setResumeStatus('File size must be under 1 MB.');
      return;
    }

    setUploadingResume(true);
    setResumeStatus('');
    try {
      const resumeBase64 = await fileToBase64(file);
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('resumeBase64', resumeBase64);
      formData.append('resumeFileName', file.name);

      const res = await fetch(
        apiUrl(`/api/applications/${selectedApp._id}/resume`),
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (!res.ok) {
        setResumeStatus(data.message || 'Failed to upload resume.');
        return;
      }
      setSelectedApp(data.application);
      setApplicants((prev) =>
        prev.map((a) => (a._id === data.application._id ? data.application : a))
      );
      setResumeKey((k) => k + 1);
      setResumeStatus('Resume uploaded. Opening viewer...');
      await viewApplicationResume(data.application._id);
    } catch (error) {
      console.error('Resume upload failed:', error);
      setResumeStatus('Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedApp || !adminUser?._id) return;

    setSending(true);
    setMessageStatus('');

    try {
      const res = await fetch(apiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: adminUser._id,
          receiverId: selectedApp.userId,
          text: messageText.trim(),
          senderRole: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageStatus(data.message || 'Failed to send message.');
        return;
      }
      setMessageText('');
      setMessageStatus(
        `Message sent to ${selectedApp.name}. They can view it in their Messages inbox.`
      );
    } catch (err) {
      console.error('Send message failed:', err);
      setMessageStatus('Failed to send message. Check that the server is running.');
    } finally {
      setSending(false);
    }
  };

  const canViewResume = !!(selectedApp?.hasResume || selectedApp?.resumePath || selectedApp?.resumeData);
  const resumeUrl = selectedApp?._id
    ? `${apiUrl(`/api/applications/${selectedApp._id}/resume`)}?v=${resumeKey}`
    : null;

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2>Candidate Registry</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage, filter, and review applications for the current term.
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Search candidates by name or major..."
          style={{ maxWidth: '300px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'review', 'interview', 'accepted', 'rejected'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Contact</th>
              <th>Major & Year</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>
                  Loading applications...
                </td>
              </tr>
            ) : (
              filteredApplicants.map((app) => (
                <tr key={app._id || app.id}>
                  <td>
                    <strong style={{ display: 'block' }}>{app.name}</strong>
                  </td>
                  <td>{app.email}</td>
                  <td>
                    {app.department} • {app.yearOfStudy}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        app.status === 'Accepted'
                          ? 'badge-success'
                          : app.status === 'Under Review' || app.status === 'Review'
                            ? 'badge-warning'
                            : app.status === 'Interview'
                              ? 'badge-primary'
                              : 'badge-danger'
                      }`}
                    >
                      {app.status === 'Interview' ? 'Interview Done' : app.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetails(app)}
                      >
                        Details
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          if (app.hasResume || app.resumePath) {
                            handleViewResume(app._id);
                          } else {
                            setSelectedApp(app);
                            setMessageText('');
                            setMessageStatus('');
                            setResumeKey((k) => k + 1);
                            setResumeStatus(
                              'Resume PDF is missing. Use Upload Resume PDF below to attach and view it.'
                            );
                          }
                        }}
                      >
                        View Resume
                      </button>
                      {(app.status === 'Under Review' || app.status === 'Review') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateStatus(app._id, 'Interview')}
                          title="Mark that this candidate has completed the HR interview"
                        >
                          Interview Done
                        </button>
                      )}
                      {app.status === 'Interview' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openRemarks(app)}
                            title="Add interview remarks before deciding Accept/Reject"
                          >
                            {app.remarks ? 'Edit Remarks' : 'Add Remarks'}
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateStatus(app._id, 'Accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateStatus(app._id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(app)}
                        disabled={deleting}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filteredApplicants.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}
                >
                  No candidates found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedApp && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeDetails}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 1000,
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
              width: 'min(820px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ marginBottom: '4px' }}>{selectedApp.name}</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{selectedApp.email}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(selectedApp)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={closeDetails}>
                  Close
                </button>
              </div>
            </div>

            <h4
              style={{
                marginBottom: '8px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '8px',
              }}
            >
              Application Details
            </h4>

            <DetailRow label="Register Number" value={selectedApp.registerNumber} />
            <DetailRow label="Gender" value={selectedApp.gender} />
            <DetailRow label="Department" value={selectedApp.department} />
            <DetailRow label="Year of Study" value={selectedApp.yearOfStudy} />
            <DetailRow label="Section" value={selectedApp.section} />
            <DetailRow label="Mobile" value={selectedApp.mobileNumber} />
            <DetailRow label="Preferred Club" value={selectedApp.preferredClub} />
            <DetailRow label="Preferred Domain" value={selectedApp.preferredDomain} />
            <DetailRow label="Has Project" value={selectedApp.hasProject} />
            {selectedApp.hasProject === 'Yes' && (
              <DetailRow label="Project Description" value={selectedApp.projectDescription} />
            )}
            <DetailRow
              label="Available for Interview"
              value={selectedApp.availableForInterview}
            />
            <DetailRow
              label="Status"
              value={
                selectedApp.status === 'Interview' ? 'Interview Done' : selectedApp.status
              }
            />
            {selectedApp.remarks ? (
              <div style={{ ...detailRowStyle, alignItems: 'start' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Remarks</span>
                <span style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {selectedApp.remarks}
                  {selectedApp.remarksUpdatedAt && (
                    <span
                      style={{
                        display: 'block',
                        marginTop: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontWeight: 400,
                      }}
                    >
                      Updated {new Date(selectedApp.remarksUpdatedAt).toLocaleString()}
                    </span>
                  )}
                </span>
              </div>
            ) : null}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
              {(selectedApp.status === 'Under Review' || selectedApp.status === 'Review') && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => updateStatus(selectedApp._id, 'Interview')}
                >
                  Interview Done
                </button>
              )}
              {selectedApp.status === 'Interview' && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openRemarks(selectedApp)}
                  >
                    {selectedApp.remarks ? 'Edit Remarks' : 'Add Remarks'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => updateStatus(selectedApp._id, 'Accepted')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => updateStatus(selectedApp._id, 'Rejected')}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>

            <h4
              style={{
                margin: '28px 0 12px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '8px',
              }}
            >
              Resume
            </h4>

            <p style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              {selectedApp.resumeFileName
                ? `File: ${selectedApp.resumeFileName}`
                : 'No resume on file yet.'}
              {!canViewResume && selectedApp.resumeFileName && (
                <span style={{ display: 'block', color: 'var(--danger, #ef4444)', marginTop: '6px' }}>
                  Filename was saved earlier, but the PDF content is missing. Upload the PDF below to view it.
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {canViewResume && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewResume(selectedApp._id)}
                >
                  View Resume
                </button>
              )}
              <label className="btn btn-secondary btn-sm" style={{ margin: 0, cursor: 'pointer' }}>
                {uploadingResume ? 'Uploading...' : canViewResume ? 'Replace Resume' : 'Upload Resume PDF'}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  disabled={uploadingResume}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {resumeStatus && (
              <p
                style={{
                  fontSize: '0.9rem',
                  marginBottom: '12px',
                  color:
                    resumeStatus.toLowerCase().includes('upload') &&
                    !resumeStatus.toLowerCase().includes('fail') &&
                    !resumeStatus.toLowerCase().includes('missing')
                      ? 'var(--success)'
                      : 'var(--danger, #ef4444)',
                }}
              >
                {resumeStatus}
              </p>
            )}

            {canViewResume ? (
              <iframe
                key={resumeKey}
                title="Applicant resume"
                src={resumeUrl}
                style={{
                  width: '100%',
                  height: '480px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: '#fff',
                }}
              />
            ) : (
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '10px',
                  padding: '28px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                Choose <strong>Upload Resume PDF</strong> to attach the applicant&apos;s file,
                then you can view it here instantly.
              </div>
            )}

            <h4
              style={{
                margin: '28px 0 12px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '8px',
              }}
            >
              Message Applicant
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Send a direct message to {selectedApp.name}. They will see it in their Messages inbox.
            </p>
            <form onSubmit={handleSendMessage}>
              <textarea
                className="form-control"
                rows={4}
                placeholder={`Write a message to ${selectedApp.name}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{ marginBottom: '12px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sending || !messageText.trim()}
                  style={{ backgroundColor: 'var(--sidebar-bg)' }}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
                {messageStatus && (
                  <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{messageStatus}</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {remarksApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remarks-title"
          onClick={closeRemarks}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 1100,
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
              width: 'min(560px, 100%)',
              margin: 0,
            }}
          >
            <h3 id="remarks-title" style={{ marginBottom: '4px' }}>
              {remarksApp.remarks ? 'Edit Remarks' : 'Add Remarks'}
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 16px', fontSize: '0.9rem' }}>
              Interview notes for <strong>{remarksApp.name}</strong>. Save now; Accept or Reject
              later when ready.
            </p>
            <textarea
              className="form-control"
              rows={6}
              placeholder="e.g. Strong technical answers, needs follow-up on availability..."
              value={remarksDraft}
              onChange={(e) => setRemarksDraft(e.target.value)}
              maxLength={5000}
              style={{ marginBottom: '12px', resize: 'vertical' }}
            />
            {remarksStatus && (
              <p
                style={{
                  fontSize: '0.9rem',
                  marginBottom: '12px',
                  color: remarksStatus.toLowerCase().includes('fail')
                    ? 'var(--danger, #ef4444)'
                    : 'var(--success)',
                }}
              >
                {remarksStatus}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveRemarks}
                disabled={savingRemarks}
              >
                {savingRemarks ? 'Saving...' : 'Save Remarks'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeRemarks}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsPage;
