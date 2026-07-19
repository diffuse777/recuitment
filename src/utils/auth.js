export const UNIVERSITY_EMAIL_DOMAIN = '@klu.ac.in';

export function isUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN);
}

/** Decode a Google credential JWT payload without verifying the signature (client-side check only). */
export function decodeGoogleCredential(credential) {
  try {
    const payload = credential?.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}
