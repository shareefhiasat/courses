/**
 * Public Link Controller
 *
 * Thin HTTP layer over publicLinkService.
 * Authenticated endpoints: create, list, revoke
 * Public endpoints: inspect, download (via token)
 */

import publicLinkService from '../services/publicLinkService.js';

export async function createPublicLink(req, res) {
  const { fileId, folderId, password, maxDownloads, expiryDays, expiresAt } = req.body;
  const actor = { userId: req.dbId, roles: req.userRoles };
  const result = await publicLinkService.createLink(
    { fileId, folderId, password, maxDownloads, expiryDays, expiresAt },
    actor
  );
  if (!result.success) return res.status(400).json(result);
  return res.status(201).json(result);
}

export async function listPublicLinks(req, res) {
  const { fileId } = req.params;
  const actor = { userId: req.dbId, roles: req.userRoles };
  const result = await publicLinkService.listLinksForFile(fileId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function revokePublicLink(req, res) {
  const { linkId } = req.params;
  const actor = { userId: req.dbId, roles: req.userRoles };
  const result = await publicLinkService.revokeLink(linkId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

// --------------------------------------------------------------------------
// Public (unauthenticated) endpoints
// --------------------------------------------------------------------------

export async function inspectPublicLink(req, res) {
  const { token } = req.params;
  const result = await publicLinkService.inspectLink(token);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function downloadViaPublicLink(req, res) {
  const { token } = req.params;
  const { password } = req.body;
  const result = await publicLinkService.resolveTokenForDownload(token, { password });
  if (!result.success) return res.status(400).json(result);

  // Stream the file through the MinIO proxy (same as authenticated download).
  const { file } = result.payload;
  const minioService = (await import('../services/minioService.js')).default;
  const fileVersionService = (await import('../services/fileVersionService.js')).default;

  // Get latest version for streaming.
  const versionRes = await fileVersionService.listVersions(file.id);
  if (!versionRes.success || !versionRes.payload.length) {
    return res.status(404).json({ success: false, error: { code: 'NO_VERSIONS', message: 'No versions available' } });
  }
  const latestVersion = versionRes.payload[0];

  const range = req.headers.range;
  const streamRes = await minioService.streamObject(latestVersion.s3Key, range);
  if (!streamRes.success) return res.status(500).json(streamRes);

  const { stream, contentLength, contentRange, statusCode } = streamRes.payload;
  res.status(statusCode);
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  if (contentRange) {
    res.setHeader('Content-Range', contentRange);
    res.setHeader('Accept-Ranges', 'bytes');
  }
  res.setHeader('Content-Length', contentLength);
  stream.pipe(res);
}

export default {
  createPublicLink,
  listPublicLinks,
  revokePublicLink,
  inspectPublicLink,
  downloadViaPublicLink,
};
