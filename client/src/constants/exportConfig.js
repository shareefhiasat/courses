/**
 * Centralized export format and MIME type constants.
 * Single source of truth for all file-format-related strings.
 */

export const EXPORT_FORMAT = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
};

export const MIME_TYPES = {
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  EXCEL_LEGACY: 'application/vnd.ms-excel',
  CSV: 'text/csv',
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  WORD_LEGACY: 'application/msword',
  POWERPOINT: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  POWERPOINT_LEGACY: 'application/vnd.ms-powerpoint',
  ZIP: 'application/zip',
  RAR: 'application/x-rar-compressed',
  SEVEN_Z: 'application/x-7z-compressed',
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
  BMP: 'image/bmp',
  TIFF: 'image/tiff',
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  AVI: 'video/avi',
  MOV: 'video/quicktime',
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  OGG: 'audio/ogg',
};

export const MIME_TO_LABEL = {
  [MIME_TYPES.PDF]: 'PDF',
  [MIME_TYPES.EXCEL]: 'Excel',
  [MIME_TYPES.EXCEL_LEGACY]: 'Excel',
  [MIME_TYPES.CSV]: 'CSV',
  [MIME_TYPES.JSON]: 'JSON',
  [MIME_TYPES.TEXT]: 'Text',
  [MIME_TYPES.HTML]: 'HTML',
  [MIME_TYPES.XML]: 'XML',
  [MIME_TYPES.WORD]: 'Word',
  [MIME_TYPES.WORD_LEGACY]: 'Word',
  [MIME_TYPES.POWERPOINT]: 'PowerPoint',
  [MIME_TYPES.POWERPOINT_LEGACY]: 'PowerPoint',
  [MIME_TYPES.ZIP]: 'ZIP',
  [MIME_TYPES.RAR]: 'RAR',
  [MIME_TYPES.SEVEN_Z]: '7Z',
  [MIME_TYPES.JPEG]: 'JPEG',
  [MIME_TYPES.JPG]: 'JPEG',
  [MIME_TYPES.PNG]: 'PNG',
  [MIME_TYPES.GIF]: 'GIF',
  [MIME_TYPES.WEBP]: 'WebP',
  [MIME_TYPES.SVG]: 'SVG',
  [MIME_TYPES.BMP]: 'BMP',
  [MIME_TYPES.TIFF]: 'TIFF',
  [MIME_TYPES.MP4]: 'MP4',
  [MIME_TYPES.WEBM]: 'WebM',
  [MIME_TYPES.AVI]: 'AVI',
  [MIME_TYPES.MOV]: 'MOV',
  [MIME_TYPES.MP3]: 'MP3',
  [MIME_TYPES.WAV]: 'WAV',
  [MIME_TYPES.OGG]: 'OGG',
};

export const MIME_TO_EXT = {
  [MIME_TYPES.PDF]: 'PDF',
  [MIME_TYPES.EXCEL]: 'XLSX',
  [MIME_TYPES.EXCEL_LEGACY]: 'XLS',
  [MIME_TYPES.CSV]: 'CSV',
  [MIME_TYPES.JSON]: 'JSON',
  [MIME_TYPES.TEXT]: 'TXT',
  [MIME_TYPES.HTML]: 'HTML',
  [MIME_TYPES.XML]: 'XML',
  [MIME_TYPES.WORD]: 'DOCX',
  [MIME_TYPES.WORD_LEGACY]: 'DOC',
  [MIME_TYPES.POWERPOINT]: 'PPTX',
  [MIME_TYPES.POWERPOINT_LEGACY]: 'PPT',
  [MIME_TYPES.ZIP]: 'ZIP',
  [MIME_TYPES.RAR]: 'RAR',
  [MIME_TYPES.SEVEN_Z]: '7Z',
  [MIME_TYPES.JPEG]: 'JPG',
  [MIME_TYPES.JPG]: 'JPG',
  [MIME_TYPES.PNG]: 'PNG',
  [MIME_TYPES.GIF]: 'GIF',
  [MIME_TYPES.WEBP]: 'WEBP',
  [MIME_TYPES.SVG]: 'SVG',
  [MIME_TYPES.BMP]: 'BMP',
  [MIME_TYPES.TIFF]: 'TIFF',
  [MIME_TYPES.MP4]: 'MP4',
  [MIME_TYPES.WEBM]: 'WEBM',
  [MIME_TYPES.AVI]: 'AVI',
  [MIME_TYPES.MOV]: 'MOV',
  [MIME_TYPES.MP3]: 'MP3',
  [MIME_TYPES.WAV]: 'WAV',
  [MIME_TYPES.OGG]: 'OGG',
};

/** Allowed MIME types for user image uploads (profile, QID, military, additional) */
export const IMAGE_UPLOAD_MIME_TYPES = [
  MIME_TYPES.JPEG,
  MIME_TYPES.JPG,
  MIME_TYPES.PNG,
  MIME_TYPES.PDF,
];

/** Allowed MIME types for drive file uploads */
export const DRIVE_UPLOAD_MIME_TYPES = [
  MIME_TYPES.JPEG,
  MIME_TYPES.PNG,
  MIME_TYPES.GIF,
  MIME_TYPES.PDF,
  MIME_TYPES.WORD_LEGACY,
  MIME_TYPES.WORD,
  MIME_TYPES.EXCEL_LEGACY,
  MIME_TYPES.EXCEL,
  MIME_TYPES.TEXT,
];

/** Chat attachment allowed MIME types */
export const CHAT_ATTACHMENT_MIME_TYPES = [
  MIME_TYPES.JPEG,
  MIME_TYPES.PNG,
  MIME_TYPES.GIF,
  MIME_TYPES.WEBP,
  MIME_TYPES.SVG,
  MIME_TYPES.MP4,
  MIME_TYPES.WEBM,
  MIME_TYPES.MOV,
  MIME_TYPES.MP3,
  MIME_TYPES.WAV,
  MIME_TYPES.OGG,
  MIME_TYPES.PDF,
  MIME_TYPES.WORD_LEGACY,
  MIME_TYPES.WORD,
  MIME_TYPES.EXCEL_LEGACY,
  MIME_TYPES.EXCEL,
  MIME_TYPES.POWERPOINT_LEGACY,
  MIME_TYPES.POWERPOINT,
  MIME_TYPES.TEXT,
  MIME_TYPES.ZIP,
  MIME_TYPES.RAR,
];

/**
 * Map an EXPORT_FORMAT value to its MIME type.
 * @param {string} format - One of EXPORT_FORMAT values
 * @returns {string} MIME type string
 */
export function mimeTypeForFormat(format) {
  if (format === EXPORT_FORMAT.PDF) return MIME_TYPES.PDF;
  if (format === EXPORT_FORMAT.CSV) return MIME_TYPES.CSV;
  return MIME_TYPES.EXCEL;
}

/**
 * Format a MIME type into a human-readable label.
 * @param {string} mimeType
 * @returns {string}
 */
export function mimeToLabel(mimeType) {
  if (!mimeType) return '\u2014';
  return MIME_TO_LABEL[mimeType] || mimeType;
}

/**
 * Map a MIME type to its short file extension label.
 * @param {string} mimeType
 * @returns {string}
 */
export function mimeToExt(mimeType) {
  if (!mimeType) return '';
  return MIME_TO_EXT[mimeType] || '';
}

export default {
  EXPORT_FORMAT,
  MIME_TYPES,
  MIME_TO_LABEL,
  MIME_TO_EXT,
  IMAGE_UPLOAD_MIME_TYPES,
  DRIVE_UPLOAD_MIME_TYPES,
  CHAT_ATTACHMENT_MIME_TYPES,
  mimeTypeForFormat,
  mimeToLabel,
  mimeToExt,
};
