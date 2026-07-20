import React from 'react';
import { pad2 } from '../utils/recruitment';

const unitStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '4.2rem',
};

const valueStyle = {
  fontSize: 'clamp(1.35rem, 4vw, 2rem)',
  fontWeight: 700,
  color: 'var(--text-main)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.02em',
  lineHeight: 1.1,
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginTop: '6px',
};

const sepStyle = {
  fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
  fontWeight: 600,
  color: 'var(--primary)',
  paddingBottom: '1.1rem',
  alignSelf: 'flex-end',
};

/**
 * Live Days : Hours : Minutes : Seconds display
 */
const RecruitmentCountdown = ({
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  heading = '',
  compact = false,
}) => {
  const units = [
    { value: pad2(days), label: 'Days' },
    { value: pad2(hours), label: 'Hours' },
    { value: pad2(minutes), label: 'Minutes' },
    { value: pad2(seconds), label: 'Seconds' },
  ];

  return (
    <div
      className="recruitment-countdown"
      style={{
        width: '100%',
        maxWidth: compact ? '420px' : '560px',
        margin: '0 auto',
      }}
    >
      {heading ? (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: compact ? '0.85rem' : '0.95rem',
            fontWeight: 600,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {heading}
        </p>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: compact ? '6px 8px' : '8px 12px',
        }}
        aria-live="polite"
      >
        {units.map((unit, index) => (
          <React.Fragment key={unit.label}>
            {index > 0 ? <span style={sepStyle} aria-hidden="true">:</span> : null}
            <div style={unitStyle}>
              <span style={valueStyle}>{unit.value}</span>
              <span style={labelStyle}>{unit.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RecruitmentCountdown;
