/**
 * Admin Scope Database Service - API Client
 * 
 * PURPOSE: Handles all admin scope operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import api from '@api';

/**
 * Get all admin scopes from API with pagination and filtering
 */
const getAdminScopes = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[AdminScopeDbService] Getting admin scopes with params:', params);
    
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.scopeType) queryParams.append('scopeType', params.scopeType);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.classroomId) queryParams.append('classroomId', params.classroomId);
    if (params.instructorUserId) queryParams.append('instructorUserId', params.instructorUserId);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/admin-scopes?${queryParams.toString()}`;
    const result = await api.get(url);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Retrieved admin scopes in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error getting admin scopes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin scopes by user ID
 */
const getAdminScopesByUserId = async (userId) => {
  const startTime = Date.now();
  try {
    console.log(`[AdminScopeDbService] Getting admin scopes for user: ${userId}`);
    
    const result = await api.get(`/admin-scopes/user/${userId}`);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Retrieved admin scopes in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error getting admin scopes by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's effective admin scope (union of all scopes)
 */
const getUserEffectiveScope = async (userId) => {
  const startTime = Date.now();
  try {
    console.log(`[AdminScopeDbService] Getting effective scope for user: ${userId}`);
    
    const result = await api.get(`/admin-scopes/user/${userId}/effective`);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Retrieved effective scope in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error getting effective scope:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin scope by ID
 */
const getAdminScopeById = async (scopeId) => {
  const startTime = Date.now();
  try {
    console.log(`[AdminScopeDbService] Getting admin scope by ID: ${scopeId}`);
    
    const result = await api.get(`/admin-scopes/${scopeId}`);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Retrieved admin scope in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error getting admin scope:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new admin scope
 */
const createAdminScope = async (scopeData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[AdminScopeDbService] Creating new admin scope', { data: scopeData });

    const result = await api.post('/admin-scopes', scopeData);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Created admin scope in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error creating admin scope:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update admin scope
 */
const updateAdminScope = async (scopeId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[AdminScopeDbService] Updating admin scope: ${scopeId}`, { data: updateData });

    const result = await api.put(`/admin-scopes/${scopeId}`, updateData);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Updated admin scope in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error updating admin scope:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete admin scope
 */
const deleteAdminScope = async (scopeId, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[AdminScopeDbService] Deleting admin scope: ${scopeId}`);

    const result = await api.delete(`/admin-scopes/${scopeId}`);

    const duration = Date.now() - startTime;
    console.log(`[AdminScopeDbService] ✅ Deleted admin scope in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AdminScopeDbService] ❌ Error deleting admin scope:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getAdminScopes,
  getAdminScopesByUserId,
  getUserEffectiveScope,
  getAdminScopeById,
  createAdminScope,
  updateAdminScope,
  deleteAdminScope
};
