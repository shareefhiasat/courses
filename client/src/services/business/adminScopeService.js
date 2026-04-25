import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'adminScopeService';

import adminScopeBusinessService from './adminScopeBusinessService.js';

export const getAllAdminScopes = async (params = {}) => {
  try {
    info(`${serviceName}:getAllAdminScopes`, { params });
    const result = await adminScopeBusinessService.getAllAdminScopes(params);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAllAdminScopes:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load admin scopes',
      data: []
    };
  }
};

export const getAdminScopesByUserId = async (userId) => {
  try {
    info(`${serviceName}:getAdminScopesByUserId`, { userId });
    const result = await adminScopeBusinessService.getAdminScopesByUserId(userId);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAdminScopesByUserId:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to load admin scopes',
      data: []
    };
  }
};

export const getUserEffectiveScope = async (userId) => {
  try {
    info(`${serviceName}:getUserEffectiveScope`, { userId });
    const result = await adminScopeBusinessService.getUserEffectiveScope(userId);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getUserEffectiveScope:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to load effective scope',
      data: null
    };
  }
};

export const getAdminScopeById = async (id) => {
  try {
    info(`${serviceName}:getAdminScopeById`, { id });
    const result = await adminScopeBusinessService.getAdminScopeById(id);
    return result;
  } catch (err) {
    console.error(`${serviceName}:getAdminScopeById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve admin scope',
      data: null
    };
  }
};

export const createAdminScope = async (scopeData, user = null) => {
  try {
    const result = await adminScopeBusinessService.createAdminScope(scopeData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:createAdminScope:error`, { error: err.message, data: scopeData });
    return {
      success: false,
      error: err.message || 'Failed to create admin scope',
      data: null
    };
  }
};

export const updateAdminScope = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateAdminScope`, { id, data: updateData });
    const result = await adminScopeBusinessService.updateAdminScope(id, updateData, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:updateAdminScope:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update admin scope',
      data: null
    };
  }
};

export const deleteAdminScope = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteAdminScope`, { id });
    const result = await adminScopeBusinessService.deleteAdminScope(id, user);
    return result;
  } catch (err) {
    console.error(`${serviceName}:deleteAdminScope:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete admin scope'
    };
  }
};
