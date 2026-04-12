import { ACTIVITY_TYPE_OPTIONS } from '@constants/activityTypes';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger.jsx';


import { info, error, warn, debug } from '@services/utils/logger.js';

const resolveExport = (mod, names) => {
  for (const name of names) {
    if (typeof mod?.[name] === 'function') return mod[name];
    if (typeof mod?.default?.[name] === 'function') return mod.default[name];
  }
  return null;
};

const toError = (error) => ({ success: false, error: error?.message || String(error) });

export const getActivities = async (options = {}) => {
  try {
    const mod = await import('../business/activitiesService');
    const fn = resolveExport(mod, ['getActivities', 'getAllActivities']);
    if (!fn) return { success: true, data: [] };
    const result = await fn(options);
    if (result?.success !== undefined) return result;
    return { success: true, data: result?.data || result || [] };
  } catch (error) {
    return toError(error);
  }
};

export const addActivity = async (activityData, user) => {
  try {
    const mod = await import('../business/activitiesService');
    const fn = resolveExport(mod, ['addActivity', 'createActivity']);
    if (!fn) return { success: false, error: 'Activity create service not available' };
    const instructorId = user?.uid || user?.id || user;
    const result = await fn(activityData, instructorId);
    return result?.success !== undefined ? result : { success: true, data: result, id: result?.id };
  } catch (error) {
    return toError(error);
  }
};

export const updateActivity = async (id, activityData, user) => {
  try {
    const mod = await import('../business/activitiesService');
    const fn = resolveExport(mod, ['updateActivity']);
    if (!fn) return { success: false, error: 'Activity update service not available' };
    const instructorId = user?.uid || user?.id || user || activityData?.instructorId;
    const result = await fn(id, activityData, instructorId);
    return result?.success !== undefined ? result : { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
};

export const deleteActivity = async (id, activityData = null, user = null) => {
  try {
    const mod = await import('../business/activitiesService');
    const fn = resolveExport(mod, ['deleteActivity']);
    if (!fn) return { success: false, error: 'Activity delete service not available' };
    const instructorId = user?.uid || user?.id || user || activityData?.instructorId;
    const result = await fn(id, instructorId);
    return result?.success !== undefined ? result : { success: true, data: result };
  } catch (error) {
    return toError(error);
  }
};

export const getAnnouncements = async (options = {}) => {
  try {
    const mod = await import('../business/announcementService');
    const fn = resolveExport(mod, ['getAnnouncements', 'getAllAnnouncements']);
    if (!fn) return { success: true, data: [] };
    const result = await fn(options);
    if (result?.success !== undefined) return result;
    return { success: true, data: result?.data || result || [] };
  } catch (error) {
    return toError(error);
  }
};

export const getResources = async (filters = {}, pagination = {}) => {
  try {
    const mod = await import('../business/resourceService');
    const fn = resolveExport(mod, ['getResources', 'getAllResources']);
    if (!fn) return { success: true, data: [], total: 0, hasMore: false };

    const page = pagination.offset ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : 1;
    const limit = pagination.limit || 100;
    const result = await fn({ ...filters, page, limit });

    if (!result?.success) {
      return result || { success: false, error: 'Failed to fetch resources' };
    }

    const data = result.data || [];
    const total = result.pagination?.total ?? data.length;
    return {
      success: true,
      data,
      total,
      hasMore: (pagination.offset || 0) + data.length < total,
    };
  } catch (error) {
    return toError(error);
  }
};

export const getResourceCount = async (filters = {}) => {
  const result = await getResources(filters, { offset: 0, limit: 10000 });
  if (!result.success) return { success: false, error: result.error, count: 0 };
  return { success: true, count: (result.data || []).length };
};

export const getAllResources = async () => getResources();

export const addActivityLog = async (log = {}) => {
  return await logActivity(log.type, log.metadata || {}, log.userId);
};

export const addLoginLog = async (log = {}) => {
  const { userId, metadata = {} } = log;
  return await logActivity(ACTIVITY_LOG_TYPES.LOGIN, metadata, userId);
};

const getActivityLogsService = async () => {
  const mod = await import('../business/activityLogsBusinessService.js');
  return {
    getAllActivityLogs: resolveExport(mod, ['getAllActivityLogs']),
    deleteActivityLog: resolveExport(mod, ['deleteActivityLog']),
  };
};

export const getLoginLogs = async () => {
  try {
    const { getAllActivityLogs } = await getActivityLogsService();
    if (!getAllActivityLogs) return { success: true, data: [] };
    return await getAllActivityLogs({ action: ACTIVITY_LOG_TYPES.LOGIN, limit: 1000 });
  } catch (error) {
    return toError(error);
  }
};

export const deleteAllLoginLogs = async (onProgress = null) => {
  try {
    const { getAllActivityLogs, deleteActivityLog: deleteLog } = await getActivityLogsService();
    if (!getAllActivityLogs || !deleteLog) return { success: false, error: 'Activity log delete service not available' };

    const logsResult = await getAllActivityLogs({ action: ACTIVITY_LOG_TYPES.LOGIN, limit: 1000 });
    if (!logsResult.success) return logsResult;

    const logs = logsResult.data || [];
    let deletedCount = 0;
    for (const log of logs) {
      await deleteLog(log.id);
      deletedCount += 1;
      if (onProgress) {
        onProgress(deletedCount, logs.length, logs.length ? Math.round((deletedCount / logs.length) * 100) : 100);
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    return toError(error);
  }
};

export const deleteLoginLogsByType = async (logType, onProgress = null) => {
  try {
    const { getAllActivityLogs, deleteActivityLog: deleteLog } = await getActivityLogsService();
    if (!getAllActivityLogs || !deleteLog) return { success: false, error: 'Activity log delete service not available' };

    const logsResult = await getAllActivityLogs({ action: logType, limit: 1000 });
    if (!logsResult.success) return logsResult;

    const logs = logsResult.data || [];
    let deletedCount = 0;
    for (const log of logs) {
      await deleteLog(log.id);
      deletedCount += 1;
      if (onProgress) {
        onProgress(deletedCount, logs.length, logs.length ? Math.round((deletedCount / logs.length) * 100) : 100);
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    return toError(error);
  }
};

export const getActivityTypes = () => ({ success: true, data: ACTIVITY_TYPE_OPTIONS });

const activityService = {
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  getAnnouncements,
  getResources,
  getResourceCount,
  getAllResources,
  addActivityLog,
  addLoginLog,
  getLoginLogs,
  deleteAllLoginLogs,
  deleteLoginLogsByType,
  getActivityTypes,
  logActivity,
  ACTIVITY_LOG_TYPES,
};

export { logActivity, ACTIVITY_LOG_TYPES };
export default activityService;
