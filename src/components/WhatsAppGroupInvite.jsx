import React from 'react';

export const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/GBws0wcYDCa6qqQNA5VFAQ?s=qt&p=a&mlu=0';

/**
 * Shown after application submit — invite to recruitment WhatsApp group.
 */
const WhatsAppGroupInvite = ({ compact = false }) => {
  return (
    <div
      style={{
        marginTop: compact ? '16px' : '20px',
        padding: compact ? '16px' : '20px',
        borderRadius: '10px',
        border: '1px solid rgba(37, 211, 102, 0.35)',
        backgroundColor: 'rgba(37, 211, 102, 0.08)',
        textAlign: 'center',
      }}
    >
      <h4
        style={{
          margin: '0 0 8px',
          color: 'var(--text-main)',
          fontSize: compact ? '1rem' : '1.1rem',
        }}
      >
        Join the WhatsApp group for updates
      </h4>
      <p
        style={{
          margin: '0 0 16px',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          lineHeight: 1.45,
        }}
      >
        Stay informed about interview schedules and recruitment announcements.
      </p>
      <img
        src="/whatsapp-group-qr.png"
        alt="OWASP & Cybernerds Recruitment WhatsApp group QR code"
        style={{
          width: 'min(220px, 70vw)',
          height: 'auto',
          borderRadius: '12px',
          display: 'block',
          margin: '0 auto 16px',
          border: '1px solid var(--border-color)',
        }}
      />
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary"
        style={{
          display: 'inline-flex',
          backgroundColor: '#25d366',
          borderColor: '#25d366',
          color: '#041016',
          WebkitTextFillColor: '#041016',
          fontWeight: 700,
        }}
      >
        Join WhatsApp Group
      </a>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          wordBreak: 'break-all',
        }}
      >
        Or open:{' '}
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#5eead4' }}
        >
          {WHATSAPP_GROUP_URL.split('?')[0]}
        </a>
      </p>
    </div>
  );
};

export default WhatsAppGroupInvite;
