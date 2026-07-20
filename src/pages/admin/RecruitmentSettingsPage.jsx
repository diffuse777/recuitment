import React, { useEffect, useState } from 'react';
import { apiUrl, parseJsonResponse } from '../../config/api';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../utils/recruitment';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Applications Not Started' },
  { value: 'open', label: 'Applications Open' },
  { value: 'closed', label: 'Applications Closed' },
];

const RecruitmentSettingsPage = () => {
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [status, setStatus] = useState('not_started');
  const [effectiveLabel, setEffectiveLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/recruitment/settings'));
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load settings.');
      }
      setOpensAt(toDatetimeLocalValue(data.settings?.opensAt));
      setClosesAt(toDatetimeLocalValue(data.settings?.closesAt));
      setStatus(data.settings?.status || 'not_started');
      setEffectiveLabel(data.settings?.effectiveStatusLabel || '');
    } catch (err) {
      setError(err.message || 'Failed to load recruitment settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(apiUrl('/api/recruitment/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opensAt: fromDatetimeLocalValue(opensAt),
          closesAt: fromDatetimeLocalValue(closesAt),
          status,
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save settings.');
      }
      setOpensAt(toDatetimeLocalValue(data.settings?.opensAt));
      setClosesAt(toDatetimeLocalValue(data.settings?.closesAt));
      setStatus(data.settings?.status || status);
      setEffectiveLabel(data.settings?.effectiveStatusLabel || '');
      setSuccess('Recruitment settings saved.');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ marginBottom: '8px' }}>Recruitment Settings</h2>
        <p style={{ color: 'var(--text-muted)' }}>Loading settings…</p>
      </div>
    );
  }

  return (
    <div>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>Recruitment Settings</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '640px' }}>
          Control when applications open and close. The public site countdown and apply
          button follow these settings. The server also rejects submissions outside the
          open window.
        </p>
      </header>

      {effectiveLabel ? (
        <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Currently live: </span>
          <strong style={{ color: 'var(--primary)' }}>{effectiveLabel}</strong>
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            color: 'var(--danger, #dc2626)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          style={{
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            border: '1px solid rgba(22, 163, 74, 0.35)',
            color: 'var(--success)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '0.9rem',
          }}
        >
          {success}
        </div>
      ) : null}

      <div className="card" style={{ maxWidth: '560px' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="opensAt">
              Application opening date &amp; time
            </label>
            <input
              id="opensAt"
              type="datetime-local"
              className="form-control"
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="closesAt">
              Application closing date &amp; time
            </label>
            <input
              id="closesAt"
              type="datetime-local"
              className="form-control"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">
              Recruitment status
            </label>
            <select
              id="status"
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadSettings}
              disabled={saving}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruitmentSettingsPage;
