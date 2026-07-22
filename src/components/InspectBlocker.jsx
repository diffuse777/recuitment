import React, { useEffect, useState } from 'react';

/**
 * Blocks common inspect / DevTools shortcuts and shows a popup.
 * Note: this is a deterrent only — it cannot fully prevent DevTools.
 */
const InspectBlocker = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showBlocked = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      setOpen(true);
    };

    const onKeyDown = (event) => {
      const key = event.key;
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      // F12
      if (key === 'F12') {
        showBlocked(event);
        return;
      }

      // Ctrl+Shift+I / J / C — Inspect, Console, Element picker
      if (ctrl && shift && ['I', 'J', 'C', 'i', 'j', 'c'].includes(key)) {
        showBlocked(event);
        return;
      }

      // Ctrl+U — View source
      if (ctrl && (key === 'u' || key === 'U')) {
        showBlocked(event);
      }
    };

    const onContextMenu = (event) => {
      showBlocked(event);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inspect-blocked-title"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 13, 22, 0.75)',
        zIndex: 9999,
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
          width: 'min(400px, 100%)',
          margin: 0,
          textAlign: 'center',
          borderColor: 'rgba(220, 38, 38, 0.4)',
        }}
      >
        <h3 id="inspect-blocked-title" style={{ marginBottom: '12px', color: '#f87171' }}>
          Inspect disabled
        </h3>
        <p style={{ color: 'var(--text-main)', marginBottom: '20px', fontSize: '0.95rem' }}>
          Inspect is disabled by the developer.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', minWidth: '100px' }}
          onClick={() => setOpen(false)}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default InspectBlocker;
