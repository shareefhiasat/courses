/**
 * File Utility Functions
 * Centralized file type detection and preview logic
 */

/**
 * Get file type category from file object
 * @param {Object} file - File object with mimeType and name
 * @returns {string} - File type: 'image', 'pdf', 'document', 'presentation', 'spreadsheet', 'unknown'
 */
export const getFileType = (file) => {
  if (!file || !file.mimeType) return 'unknown';
  const mt = file.mimeType.toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (mt.startsWith('image/')) return 'image';
  if (mt.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mt.includes('word') || mt.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
  if (mt.includes('presentation') || mt.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'presentation';
  if (mt.includes('sheet') || mt.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'spreadsheet';
  return 'unknown';
};

/**
 * Get file type category from mimeType and fileName
 * @param {string} mimeType - File MIME type
 * @param {string} fileName - File name
 * @returns {string} - File type: 'document', 'presentation', 'spreadsheet', 'unknown'
 */
export const getFileTypeFromMime = (mimeType, fileName) => {
  if (!mimeType && !fileName) return 'unknown';
  const mt = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  
  if (mt.includes('word') || mt.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) return 'document';
  if (mt.includes('presentation') || mt.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return 'presentation';
  if (mt.includes('sheet') || mt.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'spreadsheet';
  return 'unknown';
};

/**
 * Check if file is a Collabora-compatible file
 * @param {Object} file - File object with mimeType and name
 * @returns {boolean}
 */
export const isCollaboraFile = (file) => {
  const fileType = getFileType(file);
  return ['document', 'presentation', 'spreadsheet'].includes(fileType);
};

/**
 * Check if file is previewable
 * @param {Object} file - File object with mimeType and name
 * @returns {boolean}
 */
export const isPreviewable = (file) => {
  const fileType = getFileType(file);
  return ['image', 'video', 'pdf', 'document', 'presentation', 'spreadsheet'].includes(fileType);
};

/**
 * Handle file preview with version support
 * @param {Object} file - File object
 * @param {string|null} fileVersionId - Optional file version ID
 * @returns {Promise<void>}
 */
export const handleFilePreview = async (file, fileVersionId = null) => {
  const fileType = getFileType(file);
  console.log('🔍 [fileUtils] handleFilePreview called', { fileType, fileName: file.name, fileVersionId });

  // For images, use preview endpoint to get inline URL with version support
  if (fileType === 'image') {
    try {
      console.log('🔍 [fileUtils] Fetching preview for image');
      const url = fileVersionId
        ? `/api/v1/drive/files/${file.id}/preview?versionId=${fileVersionId}`
        : `/api/v1/drive/files/${file.id}/preview`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('🔍 [fileUtils] Image preview response:', data);

      if (data.success && data.payload.url) {
        console.log('🔍 [fileUtils] Opening image preview URL:', data.payload.url);
        window.open(data.payload.url, '_blank');
      } else {
        // Fallback to download if preview fails
        console.log('🔍 [fileUtils] Image preview failed, falling back to download');
        const downloadUrl = fileVersionId
          ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
          : `/api/v1/drive/files/${file.id}/download`;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('❌ [fileUtils] Failed to get image preview URL:', error);
      const downloadUrl = fileVersionId
        ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
        : `/api/v1/drive/files/${file.id}/download`;
      window.open(downloadUrl, '_blank');
    }
    return;
  }

  // For PDFs, use the download endpoint (now supports inline for PDFs) with version support
  if (fileType === 'pdf') {
    const url = fileVersionId
      ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
      : `/api/v1/drive/files/${file.id}/download`;
    console.log('🔍 [fileUtils] Opening PDF in new tab:', url);
    window.open(url, '_blank');
    return;
  }

  // For Office documents, use Collabora in read-only mode with version support
  if (fileType === 'document' || fileType === 'presentation' || fileType === 'spreadsheet') {
    try {
      console.log('🔍 [fileUtils] Fetching preview for Office document');
      const url = fileVersionId
        ? `/api/v1/drive/files/${file.id}/preview?versionId=${fileVersionId}`
        : `/api/v1/drive/files/${file.id}/preview`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('🔍 [fileUtils] Preview response:', data);

      if (data.success && data.payload.wopiToken) {
        const collaboraUrl = `https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + file.id)}&access_token=${data.payload.wopiToken}&permission=readonly`;
        console.log('🔍 [fileUtils] Opening Collabora URL:', collaboraUrl);
        window.open(collaboraUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback to download if preview fails
        console.log('🔍 [fileUtils] Preview failed, falling back to download');
        const downloadUrl = fileVersionId
          ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
          : `/api/v1/drive/files/${file.id}/download`;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('❌ [fileUtils] Failed to get preview URL:', error);
      const downloadUrl = fileVersionId
        ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
        : `/api/v1/drive/files/${file.id}/download`;
      window.open(downloadUrl, '_blank');
    }
    return;
  }

  // For other file types, just download with version support
  console.log('🔍 [fileUtils] Unknown file type, downloading');
  const downloadUrl = fileVersionId
    ? `/api/v1/drive/files/${file.id}/download?versionId=${fileVersionId}`
    : `/api/v1/drive/files/${file.id}/download`;
  window.open(downloadUrl, '_blank');
};
