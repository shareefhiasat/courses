/**
 * Export Drive Service
 *
 * Auto-uploads QR scanner exports to the user's Smart Drive "Exported" folder
 * and logs export history with a file reference.
 */

import api from '@api';
import { logExportHistory } from '@services/db/exportHistoryService.js';

const EXPORTED_FOLDER_NAME = 'Exported Files';
const EXPORTED_FOLDER_NAME_AR = 'الملفات المستخرجة';
const EXPORTED_FOLDER_COLOR = '#8b5cf6';
const LEGACY_EXPORTED_NAMES = ['Exported'];
const LEGACY_EXPORTED_NAMES_AR = ['مصدّر'];

export { MIME_TYPES as MIME, mimeTypeForFormat } from '@constants/exportConfig.js';

let cachedExportedFolderId = null;

function ensureExtension(filename, format) {
  const ext = format === 'pdf' ? '.pdf' : format === 'csv' ? '.csv' : '.xlsx';
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return filename;
  }
  return `${filename}${ext}`;
}

/**
 * Resolve or create the root "Exported" folder for the current user.
 */
export async function ensureExportedFolder() {
  if (cachedExportedFolderId) return cachedExportedFolderId;

  const treeRes = await api.get('/drive/folders/tree');
  if (treeRes.success) {
    const roots = treeRes.payload || [];
    const existing = roots.find(
      (f) => (
        f.name === EXPORTED_FOLDER_NAME ||
        f.nameAr === EXPORTED_FOLDER_NAME_AR ||
        LEGACY_EXPORTED_NAMES.includes(f.name) ||
        LEGACY_EXPORTED_NAMES_AR.includes(f.nameAr)
      ) && !f.parentId
    );
    if (existing?.id) {
      cachedExportedFolderId = existing.id;
      return existing.id;
    }
  }

  const createRes = await api.post('/drive/folders', {
    name: EXPORTED_FOLDER_NAME,
    nameAr: EXPORTED_FOLDER_NAME_AR,
    color: EXPORTED_FOLDER_COLOR,
    parentId: null,
  });

  if (createRes.success && createRes.payload?.id) {
    cachedExportedFolderId = createRes.payload.id;
    return createRes.payload.id;
  }

  if (createRes.error?.code === 'FOLDER_EXISTS') {
    const retry = await api.get('/drive/folders/tree');
    const roots = retry.payload || [];
    const existing = roots.find(
      (f) => (
        f.name === EXPORTED_FOLDER_NAME ||
        f.nameAr === EXPORTED_FOLDER_NAME_AR ||
        LEGACY_EXPORTED_NAMES.includes(f.name) ||
        LEGACY_EXPORTED_NAMES_AR.includes(f.nameAr)
      ) && !f.parentId
    );
    if (existing?.id) {
      cachedExportedFolderId = existing.id;
      return existing.id;
    }
  }

  throw new Error(createRes.error?.message || 'Failed to create Exported folder');
}

/**
 * Upload an export blob to Smart Drive → Exported folder.
 * @returns {{ fileId: string, folderId: string }}
 */
export async function uploadExportToDrive(blob, { filename, mimeType }) {
  const folderId = await ensureExportedFolder();
  const file = blob instanceof File
    ? blob
    : new File([blob], filename, { type: mimeType });

  const initiateRes = await api.post('/drive/upload/initiate', {
    name: filename,
    size: file.size,
    mimeType,
    bucket: 'PRIVATE',
    folderId,
  });

  if (!initiateRes.success) {
    throw new Error(initiateRes.error?.message || 'Upload initiation failed');
  }

  const { fileId, versionId, uploadUrl, presignedUrl } = initiateRes.payload;
  const targetUrl = uploadUrl || presignedUrl;
  if (!targetUrl || !versionId) {
    throw new Error('Upload initiation response missing URL or version ID');
  }

  const putRes = await fetch(targetUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`MinIO upload failed with status ${putRes.status}`);
  }

  const completeRes = await api.post(`/drive/upload/${fileId}/complete`, { versionId });
  if (!completeRes.success) {
    throw new Error(completeRes.error?.message || 'Upload completion failed');
  }

  return { fileId, folderId };
}

/**
 * Upload export to Smart Drive (best-effort) and log export history.
 * Always returns uploaded fileId/folderId even when history logging fails.
 */
export async function persistAndLogExport({
  blob,
  filename,
  mimeType,
  format,
  onSaved,
  ...logFields
}) {
  const fullFilename = ensureExtension(filename, format || logFields.format);
  const resolvedMime = mimeType || mimeTypeForFormat(format || logFields.format);

  let fileId;
  let folderId;
  try {
    const uploaded = await uploadExportToDrive(blob, {
      filename: fullFilename,
      mimeType: resolvedMime,
    });
    fileId = uploaded.fileId;
    folderId = uploaded.folderId;
    if (onSaved) onSaved();
  } catch (err) {
    console.warn('[exportDriveService] Smart Drive upload failed:', err);
  }

  let logResult = { success: false };
  try {
    logResult = await logExportHistory({
      ...logFields,
      format: format || logFields.format,
      filename: fullFilename,
      fileId: fileId || undefined,
      mimeType: fileId ? resolvedMime : undefined,
    });
  } catch (err) {
    console.warn('[exportDriveService] Export history log failed:', err);
  }

  return {
    ...logResult,
    fileId: fileId || logResult?.data?.fileId || null,
    folderId: folderId || null,
    filename: fullFilename,
    success: Boolean(fileId) || logResult?.success === true,
  };
}

export function resetExportedFolderCache() {
  cachedExportedFolderId = null;
}
