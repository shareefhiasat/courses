/**
 * Build Collabora Online iframe URL for a Smart Drive file (WOPI).
 */
export function buildCollaboraIframeUrl(fileId, wopiToken) {
  const collaboraUrl = import.meta.env.COLLABORA_URL || 'https://localhost:9980';
  const wopiBase = import.meta.env.VITE_WOPI_BASE_URL || 'http://host.docker.internal:8001/api/v1/wopi';
  const wopiSrc = `${wopiBase.replace(/\/$/, '')}/files/${fileId}`;
  return `${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent(wopiSrc)}&access_token=${wopiToken}`;
}

/**
 * Open a Smart Drive file in the Collabora Online viewer (read-only) in a new tab.
 * Users can still download from inside Collabora (File → Download / Save As).
 * @param {string} fileId - Drive file id
 * @returns {Promise<boolean>} true when the viewer opened successfully
 */
export async function openDriveFileInCollabora(fileId) {
  if (!fileId) return false;
  try {
    const { apiService } = await import('@services/api/apiService.js');
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/collabora/view`);
    const wopiToken = response?.payload?.wopiToken || response?.data?.payload?.wopiToken;
    if (!wopiToken) return false;
    const url = `${buildCollaboraIframeUrl(fileId, wopiToken)}&permission=readonly`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.warn('[collaboraUtils] openDriveFileInCollabora failed:', err);
    return false;
  }
}

export async function parseApiResponse(response) {
  const text = await response.text();
  if (!text) {
    return { success: false, error: { message: `Empty response (${response.status})` } };
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response (${response.status})`);
  }
}
