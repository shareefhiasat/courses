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

  // Import apiService dynamically to avoid circular dependency
  const { apiService } = await import('@services/api/apiService.js');

  // For images, use preview endpoint to get inline URL with version support
  if (fileType === 'image') {
    try {
      console.log('🔍 [fileUtils] Fetching preview for image');
      const url = fileVersionId
        ? `/drive/files/${file.id}/preview?versionId=${fileVersionId}`
        : `/drive/files/${file.id}/preview`;
      const response = await apiService.get(url);
      console.log('🔍 [fileUtils] Image preview response:', response);

      if (response.success && response.payload.url) {
        console.log('🔍 [fileUtils] Opening image preview URL:', response.payload.url);
        window.open(response.payload.url, '_blank');
      } else {
        // Fallback to download if preview fails
        console.log('🔍 [fileUtils] Image preview failed, falling back to download');
        await downloadFileWithAuth(file.id, fileVersionId);
      }
    } catch (error) {
      console.error('❌ [fileUtils] Failed to get image preview URL:', error);
      await downloadFileWithAuth(file.id, fileVersionId);
    }
    return;
  }

  // For PDFs, use the download endpoint (now supports inline for PDFs) with version support
  if (fileType === 'pdf') {
    console.log('🔍 [fileUtils] Opening PDF');
    await downloadFileWithAuth(file.id, fileVersionId);
    return;
  }

  // For Office documents, use Collabora in read-only mode with version support
  if (fileType === 'document' || fileType === 'presentation' || fileType === 'spreadsheet') {
    try {
      console.log('🔍 [fileUtils] Fetching preview for Office document');
      const url = fileVersionId
        ? `/drive/files/${file.id}/preview?versionId=${fileVersionId}`
        : `/drive/files/${file.id}/preview`;
      const response = await apiService.get(url);
      console.log('🔍 [fileUtils] Preview response:', response);

      if (response.success && response.payload.wopiToken) {
        const collaboraUrl = `https://localhost:9980/browser/4610258811/cool.html?WOPISrc=${encodeURIComponent('http://host.docker.internal:8001/api/v1/wopi/files/' + file.id)}&access_token=${response.payload.wopiToken}&permission=readonly`;
        console.log('🔍 [fileUtils] Opening Collabora URL:', collaboraUrl);
        window.open(collaboraUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback to download if preview fails
        console.log('🔍 [fileUtils] Preview failed, falling back to download');
        await downloadFileWithAuth(file.id, fileVersionId);
      }
    } catch (error) {
      console.error('❌ [fileUtils] Failed to get preview URL:', error);
      await downloadFileWithAuth(file.id, fileVersionId);
    }
    return;
  }

  // For other file types, just download with version support
  console.log('🔍 [fileUtils] Unknown file type, downloading');
  await downloadFileWithAuth(file.id, fileVersionId);
};

/**
 * Download file with authentication using apiService
 * @param {string} fileId - File ID
 * @param {string|null} fileVersionId - Optional file version ID
 * @returns {Promise<void>}
 */
async function downloadFileWithAuth(fileId, fileVersionId = null) {
  try {
    const { apiService } = await import('@services/api/apiService.js');
    const url = fileVersionId
      ? `/drive/files/${fileId}/download?versionId=${fileVersionId}`
      : `/drive/files/${fileId}/download`;

    const response = await apiService.get(url, {
      responseType: 'blob'
    });

    if (!response.success && !response.data) {
      throw new Error(response.error || 'Download failed');
    }

    const blob = response.data || response;
    const blobUrl = window.URL.createObjectURL(blob);

    // Create a hidden anchor tag to trigger download from blob
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = ''; // Let browser determine filename from Content-Disposition
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('❌ [fileUtils] Download failed:', error);
    throw error;
  }
}
