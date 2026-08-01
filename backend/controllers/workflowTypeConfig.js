import { LMS_ROLES } from '../services/keycloakAdminService.js';
import {
  createWorkflowTypeConfigService,
  getWorkflowTypeConfigsService,
  getWorkflowTypeConfigByIdService,
  updateWorkflowTypeConfigService,
  deleteWorkflowTypeConfigService,
} from '../services/workflowTypeConfigService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const requireAdmin = (user) => {
  return user?.roles && (
    user.roles.includes(LMS_ROLES.ADMIN) ||
    user.roles.includes(LMS_ROLES.SUPER_ADMIN)
  );
};

export const createWorkflowTypeConfigController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req.user)) {
    return res.status(403).json({ success: false, error: 'Admin or Super Admin role required' });
  }
  const data = { ...req.body, createdBy: req.user.dbId };
  const result = await createWorkflowTypeConfigService(data);
  res.status(201).json(result);
});

export const getWorkflowTypeConfigsController = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
  if (req.query.approvalFlow) filters.approvalFlow = req.query.approvalFlow;
  if (req.query.workflowCategory) filters.workflowCategory = req.query.workflowCategory;
  const result = await getWorkflowTypeConfigsService(filters);
  res.status(200).json(result);
});

export const getWorkflowTypeConfigByIdController = asyncHandler(async (req, res) => {
  const result = await getWorkflowTypeConfigByIdService(req.params.id);
  if (!result.success) return res.status(404).json(result);
  res.status(200).json(result);
});

export const updateWorkflowTypeConfigController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req.user)) {
    return res.status(403).json({ success: false, error: 'Admin or Super Admin role required' });
  }
  const data = { ...req.body, updatedBy: req.user.dbId };
  const result = await updateWorkflowTypeConfigService(req.params.id, data);
  res.status(200).json(result);
});

export const deleteWorkflowTypeConfigController = asyncHandler(async (req, res) => {
  if (!requireAdmin(req.user)) {
    return res.status(403).json({ success: false, error: 'Admin or Super Admin role required' });
  }
  const result = await deleteWorkflowTypeConfigService(req.params.id);
  res.status(200).json(result);
});
