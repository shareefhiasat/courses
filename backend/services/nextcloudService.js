/**
 * Nextcloud Service - Integration Adapter
 *
 * PURPOSE:
 * Wrap Nextcloud WebDAV + OCS APIs behind LMS service methods.
 * Keep workflow/business authority in LMS while delegating file collaboration actions.
 */

const serviceName = 'nextcloudService';

const NEXTCLOUD_CONFIG = {
  baseUrl: process.env.NEXTCLOUD_BASE_URL || 'http://localhost:8085',
  username: process.env.NEXTCLOUD_API_USER || 'admin',
  appPassword: process.env.NEXTCLOUD_API_APP_PASSWORD || 'admin123',
  retries: Number(process.env.NEXTCLOUD_API_RETRIES || 3),
  retryBaseMs: Number(process.env.NEXTCLOUD_API_RETRY_BASE_MS || 300),
  timeout: Number(process.env.NEXTCLOUD_API_TIMEOUT || 15000) // 15 second timeout
};

const ensureUser = async ({ userId, email = '', displayName = '' }) => {
  try {
    const payload = await withRetry('ensureUser', async () => {
      return callOcsFormApi('/cloud/users', 'POST', {
        userid: userId,
        password: `Temp-${Date.now()}`,
        email,
        displayName
      });
    });

    return resultOk(payload, { payload: { userId, email } });
  } catch (error) {
    if (error.message.includes('102') || error.message.toLowerCase().includes('exists')) {
      return resultOk({ message: 'User already exists' }, { payload: { userId, email } });
    }

    return resultErr('NEXTCLOUD_ENSURE_USER_FAILED', error.message, {
      payload: { userId, email }
    });
  }
};

const buildAuthHeader = () => {
  const token = Buffer.from(`${NEXTCLOUD_CONFIG.username}:${NEXTCLOUD_CONFIG.appPassword}`).toString('base64');
  return `Basic ${token}`;
};

const resultOk = (payload, meta = {}) => ({
  success: true,
  payload,
  timestamp: Date.now(),
  ...meta
});

const resultErr = (code, message, meta = {}) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
  ...meta
});

const parseJsonSafe = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { raw };
  }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (operationName, fn) => {
  let lastError = null;

  for (let attempt = 1; attempt <= NEXTCLOUD_CONFIG.retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < NEXTCLOUD_CONFIG.retries) {
        const backoff = NEXTCLOUD_CONFIG.retryBaseMs * (2 ** (attempt - 1));
        console.warn(`[${serviceName}] ${operationName} failed (attempt ${attempt}), retrying in ${backoff}ms`, {
          error: error.message
        });
        await wait(backoff);
      }
    }
  }

  throw lastError;
};

const callOcsApi = async (endpoint, method = 'GET', body = null) => {
  const url = `${NEXTCLOUD_CONFIG.baseUrl}/ocs/v2.php${endpoint}`;

  const headers = {
    Authorization: buildAuthHeader(),
    'OCS-APIRequest': 'true',
    Accept: 'application/json'
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(NEXTCLOUD_CONFIG.timeout)
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`OCS API ${method} ${endpoint} failed (${response.status}): ${raw.slice(0, 400)}`);
  }

  return parseJsonSafe(raw);
};

const callOcsFormApi = async (endpoint, method = 'POST', formData = {}) => {
  const url = `${NEXTCLOUD_CONFIG.baseUrl}/ocs/v1.php${endpoint}`;
  const form = new URLSearchParams();

  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: buildAuthHeader(),
      'OCS-APIRequest': 'true',
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: method === 'GET' ? undefined : form.toString(),
    signal: AbortSignal.timeout(NEXTCLOUD_CONFIG.timeout)
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OCS Form API ${method} ${endpoint} failed (${response.status}): ${raw.slice(0, 400)}`);
  }

  return parseJsonSafe(raw);
};

const callWebDav = async (path, method = 'PROPFIND', body = '', extraHeaders = {}, allowedStatuses = []) => {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${NEXTCLOUD_CONFIG.baseUrl}/remote.php/dav/files/${NEXTCLOUD_CONFIG.username}/${normalizedPath}`;

  const headers = {
    Authorization: buildAuthHeader(),
    Depth: '1',
    ...extraHeaders
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body || undefined,
    signal: AbortSignal.timeout(NEXTCLOUD_CONFIG.timeout)
  });

  const defaultAllowedStatuses = [207, 201, 204];
  const effectiveAllowedStatuses = [...defaultAllowedStatuses, ...allowedStatuses];

  if (!response.ok && !effectiveAllowedStatuses.includes(response.status)) {
    const raw = await response.text();
    throw new Error(`WebDAV ${method} ${path} failed (${response.status}): ${raw.slice(0, 400)}`);
  }

  const text = await response.text();

  return {
    status: response.status,
    raw: text
  };
};

const ensureFolder = async (folderPath) => {
  try {
    const payload = await withRetry('ensureFolder', async () => {
      const normalizedFolderPath = String(folderPath || '').replace(/^\/+|\/+$/g, '');
      if (!normalizedFolderPath) {
        return {
          folderPath,
          status: 204
        };
      }

      const segments = normalizedFolderPath.split('/').filter(Boolean);
      let currentPath = '';
      let finalStatus = 204;

      for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        const response = await callWebDav(currentPath, 'MKCOL', '', {}, [405]);
        finalStatus = response.status;
      }

      return {
        folderPath,
        status: finalStatus
      };
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_ENSURE_FOLDER_FAILED', error.message, { payload: { folderPath } });
  }
};

const moveNode = async (sourcePath, destinationPath) => {
  try {
    const payload = await withRetry('moveNode', async () => {
      const destination = `${NEXTCLOUD_CONFIG.baseUrl}/remote.php/dav/files/${NEXTCLOUD_CONFIG.username}/${destinationPath.replace(/^\//, '')}`;

      const response = await callWebDav(sourcePath, 'MOVE', '', {
        Destination: destination,
        Overwrite: 'T'
      });

      return {
        sourcePath,
        destinationPath,
        status: response.status
      };
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_MOVE_FAILED', error.message, { payload: { sourcePath, destinationPath } });
  }
};

const createShare = async ({ path, shareType = 0, shareWith = null, permissions = 1, note = '' }) => {
  try {
    const payload = await withRetry('createShare', async () => {
      const form = new URLSearchParams();
      form.set('path', path);
      form.set('shareType', String(shareType));
      form.set('permissions', String(permissions));
      if (shareWith) {
        form.set('shareWith', shareWith);
      }
      if (note) {
        form.set('note', note);
      }

      const url = `${NEXTCLOUD_CONFIG.baseUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: buildAuthHeader(),
          'OCS-APIRequest': 'true',
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
      });

      const raw = await response.text();
      if (!response.ok) {
        throw new Error(`Create share failed (${response.status}): ${raw.slice(0, 400)}`);
      }

      return raw ? JSON.parse(raw) : {};
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_CREATE_SHARE_FAILED', error.message, {
      payload: { path, shareType, shareWith, permissions }
    });
  }
};

const addComment = async ({ objectType = 'files', objectId, message }) => {
  try {
    const payload = await withRetry('addComment', async () => {
      return callOcsApi('/apps/comments/api/v1/comments', 'POST', {
        objectType,
        objectId,
        message
      });
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_ADD_COMMENT_FAILED', error.message, {
      payload: { objectType, objectId }
    });
  }
};

const uploadFile = async (filePath, fileBuffer) => {
  try {
    const payload = await withRetry('uploadFile', async () => {
      const response = await callWebDav(filePath, 'PUT', fileBuffer, {
        'Content-Type': 'application/octet-stream'
      });

      return {
        filePath,
        status: response.status,
        fileId: response.headers?.get('OC-FileId'),
        url: `${NEXTCLOUD_CONFIG.baseUrl}/remote.php/dav/files/${NEXTCLOUD_CONFIG.username}/${filePath}`
      };
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_UPLOAD_FAILED', error.message, { payload: { filePath } });
  }
};

const listFolder = async (folderPath) => {
  try {
    const payload = await withRetry('listFolder', async () => {
      const normalizedFolderPath = String(folderPath || '').replace(/^\/+|\/+$/g, '');
      const response = await callWebDav(folderPath, 'PROPFIND', `<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
          <d:prop>
            <d:displayname />
            <d:getcontentlength />
            <d:getcontenttype />
            <d:getlastmodified />
            <d:resourcetype />
            <oc:fileid />
          </d:prop>
        </d:propfind>`, {
        Depth: '1',
        'Content-Type': 'application/xml'
      });

      const getTagValue = (block, tagName) => {
        const regex = new RegExp(`<[^>]*:?${tagName}[^>]*>([\\s\\S]*?)<\\/[^>]*:?${tagName}>`, 'i');
        return block.match(regex)?.[1] || null;
      };

      const responseBlocks = response.raw.match(/<[^>]*:?response[^>]*>[\s\S]*?<\/[^>]*:?response>/gi) || [];
      const files = responseBlocks
        .map((block) => {
          const rawHref = getTagValue(block, 'href');
          if (!rawHref) return null;

          const decodedHref = decodeURIComponent(rawHref);
          const relativePath = decodedHref
            .replace(/^.*\/remote\.php\/dav\/files\/[^/]+\//, '')
            .replace(/^\/+/, '')
            .replace(/\/+$/, '');

          if (!relativePath || relativePath === normalizedFolderPath) {
            return null;
          }

          const displayName = getTagValue(block, 'displayname') || relativePath.split('/').pop();
          const contentLength = Number(getTagValue(block, 'getcontentlength') || 0);
          const contentType = getTagValue(block, 'getcontenttype');
          const lastModified = getTagValue(block, 'getlastmodified');
          const fileId = getTagValue(block, 'fileid');
          const isFolder = /<[^>]*:?collection\s*\/?\s*>|<[^>]*:?collection\/>/i.test(block);

          return {
            fileId,
            name: displayName,
            path: relativePath,
            isFolder,
            size: isFolder ? 0 : contentLength,
            mimeType: isFolder ? 'inode/directory' : contentType,
            lastModified
          };
        })
        .filter(Boolean);

      return { files, folderPath: normalizedFolderPath, status: response.status };
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_LIST_FOLDER_FAILED', error.message, { payload: { folderPath } });
  }
};

const deleteNode = async (nodePath) => {
  try {
    const payload = await withRetry('deleteNode', async () => {
      const response = await callWebDav(nodePath, 'DELETE');
      return { nodePath, status: response.status };
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_DELETE_FAILED', error.message, { payload: { nodePath } });
  }
};

const getCalendarCollections = async () => {
  try {
    const payload = await withRetry('getCalendarCollections', async () => {
      const response = await callWebDav('..', 'PROPFIND', `<?xml version="1.0"?><propfind xmlns="DAV:"><prop><displayname /></prop></propfind>`, {
        Depth: '1',
        'Content-Type': 'application/xml'
      });

      return {
        status: response.status,
        raw: response.raw
      };
    });

    return resultOk(payload);
  } catch (error) {
    return resultErr('NEXTCLOUD_CALENDAR_LIST_FAILED', error.message);
  }
};

const ensureGroup = async (groupId) => {
  try {
    const payload = await withRetry('ensureGroup', async () => {
      return callOcsFormApi('/cloud/groups', 'POST', { groupid: groupId });
    });

    return resultOk(payload, { payload: { groupId } });
  } catch (error) {
    if (error.message.includes('102') || error.message.toLowerCase().includes('exists')) {
      return resultOk({ message: 'Group already exists' }, { payload: { groupId } });
    }

    return resultErr('NEXTCLOUD_ENSURE_GROUP_FAILED', error.message, { payload: { groupId } });
  }
};

const addUserToGroup = async ({ groupId, userId }) => {
  try {
    const payload = await withRetry('addUserToGroup', async () => {
      return callOcsFormApi(`/cloud/users/${encodeURIComponent(userId)}/groups`, 'POST', { groupid: groupId });
    });

    return resultOk(payload, { payload: { groupId, userId } });
  } catch (error) {
    return resultErr('NEXTCLOUD_ADD_USER_TO_GROUP_FAILED', error.message, {
      payload: { groupId, userId }
    });
  }
};

const removeUserFromGroup = async ({ groupId, userId }) => {
  try {
    const payload = await withRetry('removeUserFromGroup', async () => {
      return callOcsFormApi(`/cloud/users/${encodeURIComponent(userId)}/groups`, 'DELETE', { groupid: groupId });
    });

    return resultOk(payload, { payload: { groupId, userId } });
  } catch (error) {
    return resultErr('NEXTCLOUD_REMOVE_USER_FROM_GROUP_FAILED', error.message, {
      payload: { groupId, userId }
    });
  }
};

const listGroups = async () => {
  try {
    const url = `${NEXTCLOUD_CONFIG.baseUrl}/ocs/v1.php/cloud/groups`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: buildAuthHeader(),
        'OCS-APIRequest': 'true',
        Accept: 'application/json'
      }
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`List groups failed (${response.status}): ${raw.slice(0, 400)}`);
    }

    return resultOk(parseJsonSafe(raw));
  } catch (error) {
    return resultErr('NEXTCLOUD_LIST_GROUPS_FAILED', error.message);
  }
};

export {
  NEXTCLOUD_CONFIG,
  ensureFolder,
  moveNode,
  createShare,
  addComment,
  getCalendarCollections,
  ensureUser,
  ensureGroup,
  addUserToGroup,
  removeUserFromGroup,
  listGroups,
  uploadFile,
  listFolder,
  deleteNode
};

export default {
  ensureFolder,
  moveNode,
  createShare,
  addComment,
  getCalendarCollections,
  ensureUser,
  ensureGroup,
  addUserToGroup,
  removeUserFromGroup,
  listGroups,
  uploadFile,
  listFolder,
  deleteNode
};
