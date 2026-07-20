/**
 * Split remaining ms into days / hours / minutes / seconds.
 * Returns zeros when time has elapsed.
 */
export function getCountdownParts(targetIso, nowMs = Date.now()) {
  if (!targetIso) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const targetMs = new Date(targetIso).getTime();
  if (Number.isNaN(targetMs)) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalMs = Math.max(0, targetMs - nowMs);
  const expired = totalMs <= 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalMs, days, hours, minutes, seconds, expired };
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Convert ISO string → value for <input type="datetime-local"> */
export function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO for API */
export function fromDatetimeLocalValue(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
