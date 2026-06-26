/**
 * SmartDrive item type helpers.
 * Folders expose a materialised `path`; files expose `mimeType` / `s3Key`.
 */
export function isDriveFolder(item) {
  return Boolean(item && typeof item.path === 'string' && !item.mimeType);
}

export function isDriveFile(item) {
  return Boolean(item && !isDriveFolder(item));
}

export function getRenamedFileName(originalName, newBaseName) {
  if (!originalName || !newBaseName) return newBaseName || originalName || '';
  const dot = originalName.lastIndexOf('.');
  if (dot <= 0) return newBaseName;
  return `${newBaseName}${originalName.slice(dot)}`;
}
