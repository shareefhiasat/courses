// Lazy loading of database service
let dbService = null;
const getDbService = async () => {
  if (!dbService) {
    dbService = await import('../db/activityDbService-postgres.js');
  }
  return dbService.default || dbService;
};

export const getActivityById = async (id) => {
  try {
    const service = await getDbService();
    return await service.getById(id);
  } catch (error) {
    console.error('activitiesService:getActivityById error:', error);
    return { success: false, error: error.message, data: null };
  }
};

// CRUD operations for activities
export const getActivities = async (params = {}) => {
  try {
    const service = await getDbService();
    return await service.getAll(params);
  } catch (error) {
    console.error('activitiesService:getActivities error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const addActivity = async (activityData, user = null) => {
  try {
    const service = await getDbService();
    return await service.create(activityData);
  } catch (error) {
    console.error('activitiesService:addActivity error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export const updateActivity = async (id, updateData, user = null) => {
  try {
    const service = await getDbService();
    return await service.update(id, updateData);
  } catch (error) {
    console.error('activitiesService:updateActivity error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export const deleteActivity = async (id, user = null) => {
  try {
    const service = await getDbService();
    return await service.delete(id);
  } catch (error) {
    console.error('activitiesService:deleteActivity error:', error);
    return { success: false, error: error.message, data: null };
  }
};

// Additional activity-related functions
export const addActivityLog = async (logData, user = null) => {
  try {
    const service = await getDbService();
    return await service.create(logData);
  } catch (error) {
    console.error('activitiesService:addActivityLog error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export const getLoginLogs = async (params = {}) => {
  try {
    const service = await getDbService();
    return await service.getAll(params);
  } catch (error) {
    console.error('activitiesService:getLoginLogs error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const deleteAllLoginLogs = async (user = null) => {
  try {
    // This would need to be implemented in the database service
    console.warn('activitiesService:deleteAllLoginLogs not implemented yet');
    return { success: false, error: 'Not implemented', data: null };
  } catch (error) {
    console.error('activitiesService:deleteAllLoginLogs error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export const deleteLoginLogsByType = async (type, user = null) => {
  try {
    // This would need to be implemented in the database service
    console.warn('activitiesService:deleteLoginLogsByType not implemented yet');
    return { success: false, error: 'Not implemented', data: null };
  } catch (error) {
    console.error('activitiesService:deleteLoginLogsByType error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export default {
  getActivityById,
  getActivities,
  addActivity,
  updateActivity,
  deleteActivity,
  addActivityLog,
  getLoginLogs,
  deleteAllLoginLogs,
  deleteLoginLogsByType,
};
