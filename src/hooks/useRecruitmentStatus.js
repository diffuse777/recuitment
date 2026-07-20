import { useCallback, useEffect, useState } from 'react';
import { apiUrl, parseJsonResponse } from '../config/api';
import { getCountdownParts } from '../utils/recruitment';

const emptyStatus = {
  opensAt: null,
  closesAt: null,
  status: 'not_started',
  effectiveStatus: 'not_started',
  statusLabel: 'Applications Not Started',
  countdownTarget: null,
  applicationsOpen: false,
  serverNow: null,
};

/**
 * Fetches public recruitment status and keeps a live countdown ticking.
 */
export function useRecruitmentStatus(pollMs = 60000) {
  const [data, setData] = useState(emptyStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/recruitment/status'));
      const json = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(json.message || 'Failed to load recruitment status.');
      }
      setData({
        opensAt: json.opensAt || null,
        closesAt: json.closesAt || null,
        status: json.status || 'not_started',
        effectiveStatus: json.effectiveStatus || 'not_started',
        statusLabel: json.statusLabel || 'Applications Not Started',
        countdownTarget: json.countdownTarget || null,
        applicationsOpen: Boolean(json.applicationsOpen),
        serverNow: json.serverNow || null,
      });
      setError('');
      if (json.serverNow) {
        const skew = new Date(json.serverNow).getTime() - Date.now();
        setNowMs(Date.now() + (Number.isFinite(skew) ? skew : 0));
      } else {
        setNowMs(Date.now());
      }
    } catch (err) {
      setError(err.message || 'Failed to load recruitment status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, pollMs);
    return () => clearInterval(poll);
  }, [fetchStatus, pollMs]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNowMs((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // When countdown expires, refresh from server so status flips to closed
  useEffect(() => {
    if (!data.countdownTarget) return undefined;
    const parts = getCountdownParts(data.countdownTarget, nowMs);
    if (parts.expired && data.effectiveStatus !== 'closed') {
      const t = setTimeout(fetchStatus, 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [data.countdownTarget, data.effectiveStatus, nowMs, fetchStatus]);

  const countdown = getCountdownParts(data.countdownTarget, nowMs);

  // Client-side effective status if countdown just hit zero
  let effectiveStatus = data.effectiveStatus;
  if (
    data.effectiveStatus === 'open' &&
    data.closesAt &&
    getCountdownParts(data.closesAt, nowMs).expired
  ) {
    effectiveStatus = 'closed';
  }
  if (
    data.effectiveStatus === 'not_started' &&
    data.opensAt &&
    !getCountdownParts(data.opensAt, nowMs).expired &&
    data.closesAt &&
    !getCountdownParts(data.closesAt, nowMs).expired &&
    data.status === 'open'
  ) {
    // Opening moment passed while page open — refresh handles it; keep not_started until refetch
  }

  const statusLabel =
    effectiveStatus === 'closed'
      ? 'Applications Closed'
      : effectiveStatus === 'open'
        ? 'Applications Open'
        : 'Applications Opening Soon';

  return {
    ...data,
    effectiveStatus,
    statusLabel:
      effectiveStatus === data.effectiveStatus ? data.statusLabel : statusLabel,
    applicationsOpen: effectiveStatus === 'open',
    countdown,
    loading,
    error,
    refresh: fetchStatus,
  };
}
