import prisma from './prismaClient.js';

export const createWorkflowTypeConfig = async (data) => {
  return await prisma.workflowTypeConfig.create({
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      description: data.description || null,
      approvalFlow: data.approvalFlow || 'HR_ONLY',
      workflowCategory: data.workflowCategory || 'GENERAL',
      requiresFile: data.requiresFile || false,
      isActive: data.isActive !== false,
      approvalSteps: data.approvalSteps || null,
      allowedRoles: data.allowedRoles || [],
      createdBy: data.createdBy || null,
      updatedBy: data.updatedBy || null,
    },
  });
};

export const getWorkflowTypeConfigs = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.approvalFlow) where.approvalFlow = filters.approvalFlow;
  if (filters.workflowCategory) where.workflowCategory = filters.workflowCategory;
  return await prisma.workflowTypeConfig.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
};

export const getWorkflowTypeConfigById = async (id) => {
  return await prisma.workflowTypeConfig.findUnique({
    where: { id: parseInt(id) },
  });
};

export const updateWorkflowTypeConfig = async (id, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.nameAr !== undefined) updateData.nameAr = data.nameAr;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.approvalFlow !== undefined) updateData.approvalFlow = data.approvalFlow;
  if (data.workflowCategory !== undefined) updateData.workflowCategory = data.workflowCategory;
  if (data.requiresFile !== undefined) updateData.requiresFile = data.requiresFile;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.approvalSteps !== undefined) updateData.approvalSteps = data.approvalSteps;
  if (data.allowedRoles !== undefined) updateData.allowedRoles = data.allowedRoles;
  if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

  return await prisma.workflowTypeConfig.update({
    where: { id: parseInt(id) },
    data: updateData,
  });
};

export const deleteWorkflowTypeConfig = async (id) => {
  return await prisma.workflowTypeConfig.delete({
    where: { id: parseInt(id) },
  });
};

export default {
  createWorkflowTypeConfig,
  getWorkflowTypeConfigs,
  getWorkflowTypeConfigById,
  updateWorkflowTypeConfig,
  deleteWorkflowTypeConfig,
};
