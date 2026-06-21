/**
 * Scheduling Summary Business Service
 */

import schedulingSummaryDb from '../db/schedulingSummaryDbService-postgres.js';

const getSchedulingSummary = async (params = {}) => {
  try {
    return await schedulingSummaryDb.getSchedulingSummary(params);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getTeacherEffort = async (teacherId, params = {}) => {
  try {
    if (!teacherId) return { success: false, error: 'Teacher ID required' };
    return await schedulingSummaryDb.getTeacherEffort(teacherId, params);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const createBreakSession = async (data) => {
  try {
    return await schedulingSummaryDb.createBreakSession(data);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const updateBreakSession = async (id, data) => {
  try {
    return await schedulingSummaryDb.updateBreakSession(id, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const deleteBreakSession = async (id) => {
  try {
    return await schedulingSummaryDb.deleteBreakSession(id);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getEffortReport = async (params = {}) => {
  try {
    return await schedulingSummaryDb.getEffortReport(params);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  getSchedulingSummary,
  getTeacherEffort,
  getEffortReport,
  createBreakSession,
  updateBreakSession,
  deleteBreakSession,
};
