/**
 * Build Collabora Online iframe URL for a Smart Drive file (WOPI).
 */
export function buildCollaboraIframeUrl(fileId, wopiToken) {
  const collaboraUrl = import.meta.env.COLLABORA_URL || 'https://localhost:9980';
  const wopiBase = import.meta.env.VITE_WOPI_BASE_URL || 'http://host.docker.internal:8001/api/v1/wopi';
  const wopiSrc = `${wopiBase.replace(/\/$/, '')}/files/${fileId}`;
  return `${collaboraUrl}/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent(wopiSrc)}&access_token=${wopiToken}`;
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
