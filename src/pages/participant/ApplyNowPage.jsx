import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fileToBase64 } from '../../utils/resume';
import { isUniversityEmail } from '../../utils/auth';
import { apiUrl } from '../../config/api';
import { useRecruitmentStatus } from '../../hooks/useRecruitmentStatus';
import RecruitmentCountdown from '../../components/RecruitmentCountdown';
import WhatsAppGroupInvite from '../../components/WhatsAppGroupInvite';

// ── Defined OUTSIDE the component so React doesn't remount on every keystroke ──
const fieldStyle = { marginBottom: '20px' };
const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-muted)'
};
const readOnlyInputStyle = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  color: 'var(--text-muted)',
  cursor: 'not-allowed',
  borderColor: 'var(--border-color)'
};
const errorStyle = {
  color: 'var(--danger, #ef4444)', fontSize: '0.8rem', marginTop: '4px'
};

const Field = ({ error, children }) => (
  <div style={fieldStyle}>
    {children}
    {error && <p className="field-error" style={errorStyle}>{error}</p>}
  </div>
);

const DOMAINS = [
  'Secretary', 'Web Development', 'Technical Team',
  'Social Media', 'PR Team', 'Research Team',
  'Event Management', 'Graphic Designer'
];

const ApplyNowPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAuthorizedParticipant =
    !!user?._id && user.role === 'participant' && isUniversityEmail(user.email);

  const [formData, setFormData] = useState({
    registerNumber: '',
    gender: '',
    department: '',
    yearOfStudy: '',
    section: '',
    mobileNumber: '',
    preferredClub: '',
    preferredDomain: '',
    hasProject: '',
    projectDescription: '',
    availableForInterview: '',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const [errors, setErrors] = useState({});
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const {
    applicationsOpen,
    effectiveStatus,
    statusLabel,
    countdown,
    loading: windowLoading,
    error: windowError,
  } = useRecruitmentStatus();

  useEffect(() => {
    const fetchExistingApplication = async () => {
      if (!isAuthorizedParticipant || !user?._id) {
        setCheckingExisting(false);
        return;
      }
      try {
        const response = await fetch(
          apiUrl(`/api/applications/my-application?userId=${encodeURIComponent(user._id)}`)
        );
        const data = await response.json();
        if (data.application) {
          setAlreadyApplied(true);
        }
      } catch (error) {
        console.error('Error fetching existing application:', error);
      } finally {
        setCheckingExisting(false);
      }
    };
    fetchExistingApplication();
  }, [user, isAuthorizedParticipant]);

  // Unauthenticated users cannot access the application form
  if (!isAuthorizedParticipant) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    setResumeError('');
    if (!file) { setResumeFile(null); return; }
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed.');
      setResumeFile(null);
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setResumeError('File size must be under 1 MB.');
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.registerNumber.trim()) newErrors.registerNumber = 'Register number is required.';
    if (!formData.gender) newErrors.gender = 'Please select your gender.';
    if (!formData.department) newErrors.department = 'Please select your department.';
    if (!formData.yearOfStudy) newErrors.yearOfStudy = 'Please select your year of study.';
    if (!formData.section.trim()) newErrors.section = 'Section is required.';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!formData.preferredClub) newErrors.preferredClub = 'Please select a preferred club.';
    if (!formData.preferredDomain) newErrors.preferredDomain = 'Please select a preferred domain.';
    if (!formData.hasProject) newErrors.hasProject = 'Please answer this question.';
    if (formData.hasProject === 'Yes' && !formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Please describe your project.';
    }
    if (!formData.availableForInterview) newErrors.availableForInterview = 'Please answer this question.';
    if (!resumeFile) newErrors.resume = 'Please upload your resume PDF so admins can view it.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setResumeError('');
    setSuccessMessage('');

    if (alreadyApplied) {
      setSubmitError('You have already submitted your application.');
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.resume) setResumeError(newErrors.resume);
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Resume file validation
    if (!resumeFile) {
      setResumeError('Resume PDF is required.');
      return;
    }
    if (resumeFile.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed.');
      return;
    }
    if (resumeFile.size > 1 * 1024 * 1024) {
      setResumeError('File size must be under 1 MB.');
      return;
    }

    setLoading(true);
    try {
      const resumeBase64 = await fileToBase64(resumeFile);
      const payload = new FormData();
      // Link application to logged-in participant (server uses account email)
      payload.append('userId', user._id);
      payload.append('name', user.name || '');
      payload.append('email', user.email);
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value ?? '');
      });
      payload.append('resume', resumeFile);
      payload.append('resumeBase64', resumeBase64);
      payload.append('resumeFileName', resumeFile.name);

      const response = await fetch(apiUrl('/api/applications'), {
        method: 'POST',
        body: payload,
      });
      const data = await response.json();

      if (response.ok) {
        setAlreadyApplied(true);
        setSuccessMessage(
          data.message || 'Application submitted successfully.'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (
        response.status === 400 &&
        String(data.message || '').toLowerCase().includes('already submitted')
      ) {
        setAlreadyApplied(true);
        setSubmitError('You have already submitted your application.');
      } else if (data.code === 'APPLICATIONS_CLOSED' || response.status === 403) {
        setSubmitError(
          data.message || 'Applications are closed. New submissions are no longer accepted.'
        );
      } else if (response.status === 401 || data.code === 'SESSION_INVALID') {
        setSubmitError(data.message || 'Your session is no longer valid. Please log in again.');
        logout();
        setTimeout(() => navigate('/login', { replace: true }), 1200);
      } else {
        setSubmitError(data.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting || windowLoading) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Checking your application status…</p>
      </div>
    );
  }

  // Already applied — do not allow a second application
  if (alreadyApplied && !successMessage) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '80px 24px', textAlign: 'center' }}>
        <div className="card">
          <h2 style={{ marginBottom: '12px' }}>Application Already Submitted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.95rem' }}>
            You have already submitted your application.
          </p>
          <WhatsAppGroupInvite compact />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
            <Link to="/participant/status" className="btn btn-primary">
              View Application Status
            </Link>
            <Link to="/participant/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fresh submit success — show WhatsApp invite before continuing
  if (successMessage) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '80px 24px', textAlign: 'center' }}>
        <div className="card">
          <h2 style={{ marginBottom: '12px', color: 'var(--success)' }}>Application Submitted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.95rem' }}>
            {successMessage}
          </p>
          <WhatsAppGroupInvite />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
            <Link to="/participant/status" className="btn btn-primary" replace>
              View Application Status
            </Link>
            <Link to="/participant/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!applicationsOpen) {
    const heading =
      effectiveStatus === 'closed' ? 'Applications Closed' : 'Applications Opening Soon';
    const showOpening =
      effectiveStatus === 'not_started' && !countdown.expired && countdown.totalMs > 0;
    const note =
      effectiveStatus === 'closed'
        ? 'The application window has ended. New submissions are no longer accepted.'
        : 'Applications are not open yet. Please wait until the recruitment window begins.';

    return (
      <div className="container" style={{ maxWidth: '640px', padding: '80px 24px', textAlign: 'center' }}>
        <div className="card">
          <h2 style={{ marginBottom: '12px' }}>{heading}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
            {windowError || note}
          </p>
          {showOpening ? (
            <div style={{ marginBottom: '20px' }}>
              <RecruitmentCountdown
                heading="Applications Open In"
                days={countdown.days}
                hours={countdown.hours}
                minutes={countdown.minutes}
                seconds={countdown.seconds}
                compact
              />
            </div>
          ) : null}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Current status: {statusLabel}
          </p>
          <Link to="/participant/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '820px', padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2>Club Application Form</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Fill in the details below to apply for CYBERNERDS X OWSAP.
          Fields marked with <span style={{ color: 'var(--danger, #ef4444)' }}>*</span> are required.
          Your application will be linked to <strong>{user.email}</strong>.
        </p>
      </header>

      {submitError && (
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444',
          padding: '14px 16px', borderRadius: '8px',
          border: '1px solid #ef4444', marginBottom: '24px', fontSize: '0.9rem'
        }}>
          {submitError}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Section: Personal Info ── */}
          <h3 className="card-title" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Personal Information
          </h3>

          <div className="grid-cols-2" style={{ gap: '20px' }}>
            {/* Name – auto filled, read-only */}
            <Field>
              <label style={labelStyle}>Name <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                value={user?.name || ''}
                readOnly
                style={readOnlyInputStyle}
              />
            </Field>

            {/* Register Number */}
            <Field error={errors.registerNumber}>
              <label style={labelStyle}>Register Number <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <input
                type="text"
                name="registerNumber"
                className="form-control"
                placeholder="Enter your register number"
                value={formData.registerNumber}
                onChange={handleChange}
                style={errors.registerNumber ? { borderColor: '#ef4444' } : {}}
              />
            </Field>

            {/* Gender */}
            <Field error={errors.gender}>
              <label style={labelStyle}>Gender <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <select
                name="gender"
                className="form-control"
                value={formData.gender}
                onChange={handleChange}
                style={errors.gender ? { borderColor: '#ef4444' } : {}}
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>

            {/* Department */}
            <Field error={errors.department}>
              <label style={labelStyle}>Department <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <input
                type="text"
                name="department"
                className="form-control"
                placeholder="Enter your department"
                value={formData.department}
                onChange={handleChange}
                style={errors.department ? { borderColor: '#ef4444' } : {}}
              />
            </Field>

            {/* Year of Study */}
            <Field error={errors.yearOfStudy}>
              <label style={labelStyle}>Year of Study <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <select
                name="yearOfStudy"
                className="form-control"
                value={formData.yearOfStudy}
                onChange={handleChange}
                style={errors.yearOfStudy ? { borderColor: '#ef4444' } : {}}
              >
                <option value="">-- Select Year --</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </Field>

            {/* Section */}
            <Field error={errors.section}>
              <label style={labelStyle}>Section <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <input
                type="text"
                name="section"
                className="form-control"
                placeholder="Enter your section"
                value={formData.section}
                onChange={handleChange}
                style={errors.section ? { borderColor: '#ef4444' } : {}}
              />
            </Field>
          </div>

          {/* Mail ID – auto filled, read-only (full width) */}
          <Field>
            <label style={labelStyle}>Mail ID <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
            <input
              type="email"
              className="form-control"
              value={user?.email || ''}
              readOnly
              style={readOnlyInputStyle}
            />
          </Field>

          {/* Mobile Number */}
          <Field error={errors.mobileNumber}>
            <label style={labelStyle}>Mobile Number <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
            <input
              type="text"
              inputMode="numeric"
              name="mobileNumber"
              className="form-control"
              placeholder="Enter your 10-digit mobile number"
              maxLength={10}
              value={formData.mobileNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, mobileNumber: val }));
                if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: '' }));
              }}
              style={errors.mobileNumber ? { borderColor: '#ef4444' } : {}}
            />
          </Field>

          {/* ── Section: Club Preferences ── */}
          <h3 className="card-title" style={{ margin: '28px 0 20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Club Preferences
          </h3>

          <div className="grid-cols-2" style={{ gap: '20px' }}>
            {/* Preferred Club */}
            <Field error={errors.preferredClub}>
              <label style={labelStyle}>Preferred Club <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <select
                name="preferredClub"
                className="form-control"
                value={formData.preferredClub}
                onChange={handleChange}
                style={errors.preferredClub ? { borderColor: '#ef4444' } : {}}
              >
                <option value="">-- Select Club --</option>
                <option value="CYBERNERDS">CYBERNERDS</option>
                <option value="OWASP">OWASP</option>
              </select>
            </Field>

            {/* Preferred Domain */}
            <Field error={errors.preferredDomain}>
              <label style={labelStyle}>Preferred Domain <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <select
                name="preferredDomain"
                className="form-control"
                value={formData.preferredDomain}
                onChange={handleChange}
                style={errors.preferredDomain ? { borderColor: '#ef4444' } : {}}
              >
                <option value="">-- Select Domain --</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          {/* ── Section: Additional Questions ── */}
          <h3 className="card-title" style={{ margin: '28px 0 20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Additional Information
          </h3>

          {/* Has Project */}
          <Field error={errors.hasProject}>
            <label style={labelStyle}>Have you worked on any project? <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
            <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
              {['Yes', 'No'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="radio"
                    name="hasProject"
                    value={opt}
                    checked={formData.hasProject === opt}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          {/* Project Description – shown only when hasProject === 'Yes' */}
          {formData.hasProject === 'Yes' && (
            <Field error={errors.projectDescription}>
              <label style={labelStyle}>Project Description <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
              <textarea
                name="projectDescription"
                className="form-control"
                rows={4}
                placeholder="Briefly describe your project — what it does, tech stack used, and your role..."
                value={formData.projectDescription}
                onChange={handleChange}
                style={errors.projectDescription ? { borderColor: '#ef4444' } : {}}
              />
            </Field>
          )}

          {/* Available for interview */}
          <Field error={errors.availableForInterview}>
            <label style={labelStyle}>Are you available for the interview? <span style={{ color: 'var(--danger,#ef4444)' }}>*</span></label>
            <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
              {['Yes', 'No'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input
                    type="radio"
                    name="availableForInterview"
                    value={opt}
                    checked={formData.availableForInterview === opt}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          {/* ── Resume Upload ── */}
          <h3 className="card-title" style={{ margin: '28px 0 20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Resume Upload <span style={{ color: 'var(--danger,#ef4444)' }}>*</span>
          </h3>

          <Field>
            <label style={labelStyle}>Upload Your Resume</label>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '10px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>
              <input
                type="file"
                id="resumeUpload"
                accept="application/pdf"
                onChange={handleResumeChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="resumeUpload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📄</div>
                {resumeFile ? (
                  <div>
                    <p style={{ color: 'var(--success)', fontWeight: '600' }}>✓ {resumeFile.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '4px' }}>Click to upload resume</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF only · Max 1 MB</p>
                  </div>
                )}
              </label>
            </div>
            {resumeError && <p style={errorStyle}>{resumeError}</p>}
          </Field>

          {/* ── Submit ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !!successMessage}
              style={{
                padding: '12px 40px',
                fontSize: '1rem',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ApplyNowPage;
