import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';

const DOMAINS = [
  'Secretary',
  'Web Development',
  'Technical Team',
  'Social Media',
  'PR Team',
  'Research Team',
  'Event Management',
  'Graphic Designer',
];

const STATUS_OPTIONS = [
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Interview', label: 'Interview Done' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
];

const ExportPage = () => {
  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState('Under Review');
  const [club, setClub] = useState('CYBERNERDS');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [format, setFormat] = useState('csv');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await fetch(apiUrl('/api/applications'));
        const data = await res.json();
        setTotalCount((data.applications || []).length);
      } catch {
        setTotalCount(null);
      }
    };
    loadCount();
  }, []);

  const handleExport = async (e) => {
    e.preventDefault();
    setError('');
    setDownloading(true);

    try {
      const params = new URLSearchParams({
        scope,
        format: format === 'excel' ? 'xlsx' : format, // csv | xlsx | pdf
      });

      if (scope === 'filtered') params.set('status', status);
      if (scope === 'club') params.set('club', club);
      if (scope === 'domain') params.set('domain', domain);

      const res = await fetch(
        apiUrl(`/api/applications/export?${params.toString()}`)
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Export failed. Please try again.');
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const extension =
        format === 'excel' || format === 'xlsx'
          ? 'xlsx'
          : format === 'pdf'
            ? 'pdf'
            : 'csv';
      const filename = match?.[1] || `applicants_export.${extension}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Could not reach the server to export data.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2>Export Recruitment Data</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Download applicant records as CSV, Excel, or PDF with the filters you need.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title">Export configuration</h3>
        <form onSubmit={handleExport}>
          <div className="form-group">
            <label className="form-label" htmlFor="exportScope">
              Data scope
            </label>
            <select
              id="exportScope"
              className="form-control"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="all">All applicants</option>
              <option value="filtered">Filtered applicants (by status)</option>
              <option value="shortlisted">Shortlisted applicants</option>
              <option value="club">Applicants by preferred club</option>
              <option value="domain">Applicants by preferred domain</option>
            </select>
          </div>

          {scope === 'filtered' && (
            <div className="form-group">
              <label className="form-label" htmlFor="exportStatus">
                Status filter
              </label>
              <select
                id="exportStatus"
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
          )}

          {scope === 'club' && (
            <div className="form-group">
              <label className="form-label" htmlFor="exportClub">
                Preferred club
              </label>
              <select
                id="exportClub"
                className="form-control"
                value={club}
                onChange={(e) => setClub(e.target.value)}
              >
                <option value="CYBERNERDS">CYBERNERDS</option>
                <option value="OWASP">OWASP</option>
              </select>
            </div>
          )}

          {scope === 'domain' && (
            <div className="form-group">
              <label className="form-label" htmlFor="exportDomain">
                Preferred domain
              </label>
              <select
                id="exportDomain"
                className="form-control"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'shortlisted' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Includes candidates marked Interview Done or Accepted.
            </p>
          )}

          <div className="form-group">
            <label className="form-label">File format</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                />
                CSV (.csv)
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                />
                Excel (.xlsx)
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                />
                PDF (.pdf)
              </label>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
            {format === 'pdf'
              ? 'PDF includes university letterhead and a table of Name, Register Number, Preferred Club, and Domain.'
              : 'CSV / Excel includes: name, email, register number, gender, department, year, section, mobile, preferred club/domain, project details, interview availability, resume info, status, and timestamps.'}
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
                marginBottom: '16px',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={downloading}
          >
            {downloading
              ? 'Generating export…'
              : `Download ${format === 'excel' ? 'Excel' : format === 'pdf' ? 'PDF' : 'CSV'} file`}
          </button>
        </form>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: '12px' }}>Database summary</h4>
        <div className="grid-cols-2" style={{ gap: '16px', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total applicants</span>
            <div style={{ fontWeight: '600', marginTop: '4px' }}>
              {totalCount === null ? '—' : totalCount}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Supported formats</span>
            <div style={{ fontWeight: '600', marginTop: '4px' }}>CSV · Excel · PDF</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
