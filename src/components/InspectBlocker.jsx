import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shows the inspect-disabled popup ONLY when the user presses
 * F12 / DevTools shortcuts / right-click — never automatically.
 */
const InspectBlocker = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showPopup = (event) => {
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

      // F12 only
      if (key === 'F12') {
        showPopup(event);
        return;
      }

      // Ctrl+Shift+I / J / C / K — DevTools shortcuts
      if (ctrl && shift && ['I', 'J', 'C', 'K', 'i', 'j', 'c', 'k'].includes(key)) {
        showPopup(event);
        return;
      }

      // Ctrl+U — view source
      if (ctrl && (key === 'u' || key === 'U')) {
        showPopup(event);
      }
    };

    const onContextMenu = (event) => {
      showPopup(event);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, []);

  if (!open) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inspect-blocked-title"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 13, 22, 0.75)',
        zIndex: 2147483646,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        userSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
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
    </div>,
    document.body
  );
};

export default InspectBlocker;
