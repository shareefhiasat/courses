import {
  createWorkflowTypeConfig,
  getWorkflowTypeConfigs,
  getWorkflowTypeConfigById,
  updateWorkflowTypeConfig,
  deleteWorkflowTypeConfig,
} from '../db/workflowTypeConfig-postgres.js';

export const createWorkflowTypeConfigService = async (data) => {
  const config = await createWorkflowTypeConfig(data);
  return { success: true, data: config };
};

export const getWorkflowTypeConfigsService = async (filters) => {
  const configs = await getWorkflowTypeConfigs(filters);
  return { success: true, data: configs };
};

export const getWorkflowTypeConfigByIdService = async (id) => {
  const config = await getWorkflowTypeConfigById(id);
  if (!config) return { success: false, error: 'Workflow type config not found' };
  return { success: true, data: config };
};

export const updateWorkflowTypeConfigService = async (id, data) => {
  const config = await updateWorkflowTypeConfig(id, data);
  return { success: true, data: config };
};

export const deleteWorkflowTypeConfigService = async (id) => {
  await deleteWorkflowTypeConfig(id);
  return { success: true };
};

export default {
  createWorkflowTypeConfigService,
  getWorkflowTypeConfigsService,
  getWorkflowTypeConfigByIdService,
  updateWorkflowTypeConfigService,
  deleteWorkflowTypeConfigService,
};
