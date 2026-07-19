import { apiUrl } from '../config/api';

/** Convert a File to a base64 data URL for reliable resume upload. */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read resume file.'));
    reader.readAsDataURL(file);
  });
}

/** Open an application resume in a new tab (fetches PDF from API). */
export async function viewApplicationResume(applicationId) {
  const res = await fetch(
    apiUrl(`/api/applications/${applicationId}/resume`)
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Resume file is not available to view.');
  }
  const blob = await res.blob();
  if (!blob.size || blob.type.includes('json')) {
    throw new Error('Resume file is not available to view.');
  }
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  // Revoke later so the tab can still load the blob
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}
