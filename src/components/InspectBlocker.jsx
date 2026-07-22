import React, { useEffect, useState, useCallback } from 'react';

/**
 * Deterrent against casual inspection.
 * Browsers do not allow a site to truly turn off DevTools.
 * In production we detect when it is open and block the UI until it is closed.
 */
const InspectBlocker = () => {
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState('Inspect is disabled by the developer.');
  const isProd = import.meta.env.PROD;

  const lock = useCallback((message) => {
    setReason(message || 'Inspect is disabled by the developer.');
    setBlocked(true);
  }, []);

  useEffect(() => {
    const showFromShortcut = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      lock('Inspect is disabled by the developer.');
    };

    const onKeyDown = (event) => {
      const key = event.key;
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      if (key === 'F12') {
        showFromShortcut(event);
        return;
      }
      if (ctrl && shift && ['I', 'J', 'C', 'K', 'i', 'j', 'c', 'k'].includes(key)) {
        showFromShortcut(event);
        return;
      }
      if (ctrl && (key === 'u' || key === 'U' || key === 's' || key === 'S')) {
        showFromShortcut(event);
      }
    };

    const onContextMenu = (event) => {
      showFromShortcut(event);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu, true);

    // Aggressive detection only on the live deployed site
    if (!isProd) {
      return () => {
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('contextmenu', onContextMenu, true);
      };
    }

    const detectBySize = () => {
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);
      if (widthGap > 160 || heightGap > 160) {
        lock('Developer tools detected. Inspect is disabled by the developer.');
        return true;
      }
      return false;
    };

    const detectByConsole = () => {
      let opened = false;
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get() {
          opened = true;
          return 'devtools';
        },
      });
      // eslint-disable-next-line no-console
      console.log('%c', element);
      try {
        // eslint-disable-next-line no-console
        console.clear();
      } catch {
        /* ignore */
      }
      if (opened) {
        lock('Developer tools detected. Inspect is disabled by the developer.');
      }
      return opened;
    };

    const debuggerTrap = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      if (performance.now() - start > 100) {
        lock('Developer tools detected. Inspect is disabled by the developer.');
        return true;
      }
      return false;
    };

    const runChecks = () => {
      if (detectBySize()) return;
      try {
        if (detectByConsole()) return;
      } catch {
        /* ignore */
      }
      try {
        debuggerTrap();
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('resize', detectBySize);
    runChecks();
    const interval = setInterval(runChecks, 1200);

    try {
      const noop = () => {};
      ['log', 'debug', 'info', 'table', 'dir'].forEach((method) => {
        // eslint-disable-next-line no-console
        console[method] = noop;
      });
    } catch {
      /* ignore */
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('resize', detectBySize);
      clearInterval(interval);
    };
  }, [isProd, lock]);

  useEffect(() => {
    if (!blocked || !isProd) return undefined;

    const tryUnlock = () => {
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);
      if (widthGap <= 160 && heightGap <= 160) {
        setBlocked(false);
      }
    };

    const id = setInterval(tryUnlock, 800);
    return () => clearInterval(id);
  }, [blocked, isProd]);

  if (!blocked) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inspect-blocked-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#080d16',
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
        style={{
          width: 'min(440px, 100%)',
          textAlign: 'center',
          border: '1px solid rgba(248, 113, 113, 0.45)',
          borderRadius: '10px',
          padding: '28px 24px',
          backgroundColor: '#111827',
        }}
      >
        <h3
          id="inspect-blocked-title"
          style={{ marginBottom: '12px', color: '#f87171', fontSize: '1.25rem' }}
        >
          Inspect disabled
        </h3>
        <p style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {reason}
        </p>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>
          Close developer tools to continue using this website.
        </p>
      </div>
    </div>
  );
};

export default InspectBlocker;
