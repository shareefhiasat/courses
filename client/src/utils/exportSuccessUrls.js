import { appConfig } from '@services/config/apiConfig.js';

export function buildDriveDownloadUrl(fileId) {
  const relativeUrl = appConfig.buildApiUrl(`/drive/files/${fileId}/download`);
  return relativeUrl.startsWith('http') ? relativeUrl : `${window.location.origin}${relativeUrl}`;
}

export function buildBlobOpenUrl({ blobUrl, fileId } = {}) {
  if (blobUrl) return blobUrl;
  if (fileId) return buildDriveDownloadUrl(fileId);
  return null;
}

/** Extract drive file id from persistAndLogExport / logExportHistory responses. */
export function extractExportFileId(persisted) {
  if (!persisted) return null;
  return persisted.fileId || persisted?.data?.fileId || null;
}

export function extractExportFolderId(persisted) {
  if (!persisted) return null;
  return persisted.folderId || persisted?.data?.folderId || null;
}

/** Opens Smart Drive → Exported folder, scrolls to file, optional one-time joyride. */
export function buildSmartDriveHighlightUrl(fileId, { folder = 'Exported', filename, folderId } = {}) {
  const params = new URLSearchParams();
  if (folderId) params.set('folderId', folderId);
  else if (folder) params.set('folder', folder);
  if (fileId) params.set('highlightFileId', fileId);
  else if (filename) params.set('highlightFilename', filename);
  params.set('exportTour', '1');
  return `${window.location.origin}/smart-drive?${params.toString()}`;
}
