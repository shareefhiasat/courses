/**
 * Dashboard Database Service - API Client
 * 
 * PURPOSE: Handles dashboard operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get dashboard summary
 */
const getDashboardSummary = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[DashboardDbService] Getting dashboard summary with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.instructorId) queryParams.append('instructorId', params.instructorId);

    const url = `/dashboard/summary${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[DashboardDbService] ✅ Retrieved dashboard summary in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[DashboardDbService] ❌ Error getting dashboard summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get teacher dashboard
 */
const getTeacherDashboard = async (teacherUserId) => {
  const startTime = Date.now();
  try {
    console.log(`[DashboardDbService] Getting teacher dashboard for user: ${teacherUserId}`);
    
    const result = await api.get(`/dashboard/teacher/${teacherUserId}`);

    const duration = Date.now() - startTime;
    console.log(`[DashboardDbService] ✅ Retrieved teacher dashboard in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[DashboardDbService] ❌ Error getting teacher dashboard:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getDashboardSummary,
  getTeacherDashboard
};
