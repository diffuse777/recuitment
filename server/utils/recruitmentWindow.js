import RecruitmentSettings, { RECRUITMENT_STATUSES } from '../models/RecruitmentSettings.js';

export const STATUS_LABELS = {
  not_started: 'Applications Not Started',
  open: 'Applications Open',
  closed: 'Applications Closed',
};

/**
 * Resolve what participants see / what the API enforces.
 * Manual "closed" always wins. Past closesAt auto-closes.
 * Before opensAt → not started. Otherwise use admin status within the window.
 */
export function resolveEffectiveStatus(settings, now = new Date()) {
  if (!settings) return 'not_started';

  const opensAt = settings.opensAt ? new Date(settings.opensAt) : null;
  const closesAt = settings.closesAt ? new Date(settings.closesAt) : null;
  const configured = RECRUITMENT_STATUSES.includes(settings.status)
    ? settings.status
    : 'not_started';

  if (configured === 'closed') return 'closed';
  if (closesAt && !Number.isNaN(closesAt.getTime()) && now.getTime() > closesAt.getTime()) {
    return 'closed';
  }
  if (opensAt && !Number.isNaN(opensAt.getTime()) && now.getTime() < opensAt.getTime()) {
    return 'not_started';
  }
  if (configured === 'not_started') return 'not_started';
  if (configured === 'open') return 'open';
  return 'not_started';
}

export function buildPublicPayload(settings, now = new Date()) {
  const effectiveStatus = resolveEffectiveStatus(settings, now);
  const opensAt = settings?.opensAt ? new Date(settings.opensAt).toISOString() : null;
  const closesAt = settings?.closesAt ? new Date(settings.closesAt).toISOString() : null;

  let countdownTarget = null;
  if (effectiveStatus === 'not_started' && opensAt) countdownTarget = opensAt;
  if (effectiveStatus === 'open' && closesAt) countdownTarget = closesAt;

  return {
    opensAt,
    closesAt,
    status: settings?.status || 'not_started',
    effectiveStatus,
    statusLabel: STATUS_LABELS[effectiveStatus],
    countdownTarget,
    serverNow: now.toISOString(),
    applicationsOpen: effectiveStatus === 'open',
  };
}

export async function getOrCreateSettings() {
  let settings = await RecruitmentSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await RecruitmentSettings.create({
      key: 'default',
      status: 'not_started',
      opensAt: null,
      closesAt: null,
    });
  }
  return settings;
}

export async function assertApplicationsOpen() {
  const settings = await getOrCreateSettings();
  const effective = resolveEffectiveStatus(settings);
  if (effective !== 'open') {
    const message =
      effective === 'closed'
        ? 'Applications are closed. New submissions are no longer accepted.'
        : 'Applications have not opened yet. Please check back later.';
    const error = new Error(message);
    error.statusCode = 403;
    error.code = 'APPLICATIONS_CLOSED';
    error.effectiveStatus = effective;
    throw error;
  }
  return settings;
}
