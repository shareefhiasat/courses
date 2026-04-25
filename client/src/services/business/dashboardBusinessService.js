/**
 * Dashboard Business Service
 * 
 * PURPOSE: Business logic layer for dashboard-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import dashboardDbService from '../db/dashboardDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'dashboardBusinessService';

const getDashboardSummary = async (params = {}) => {
  try {
    info(`${serviceName}:getDashboardSummary`, { params });
    const result = await dashboardDbService.getDashboardSummary(params);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getDashboardSummary:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load dashboard summary',
      data: null
    };
  }
};

const getTeacherDashboard = async (teacherUserId) => {
  try {
    info(`${serviceName}:getTeacherDashboard`, { teacherUserId });
    
    if (!teacherUserId) {
      return {
        success: false,
        error: 'Teacher user ID is required',
        data: null
      };
    }
    
    const result = await dashboardDbService.getTeacherDashboard(teacherUserId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getTeacherDashboard:error`, { error: error.message, teacherUserId });
    return {
      success: false,
      error: error.message || 'Failed to load teacher dashboard',
      data: null
    };
  }
};

export default {
  getDashboardSummary,
  getTeacherDashboard
};
