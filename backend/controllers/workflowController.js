/**
 * Workflow Controller
 *
 * Thin HTTP layer over workflowEngine.
 */

import workflowEngine from '../services/workflowEngine.js';

// --------------------------------------------------------------------------
// Workflow Definitions
// --------------------------------------------------------------------------

export async function createDefinition(req, res) {
  const { name, description, entityType, stages } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.createWorkflowDefinition(
    { name, description, entityType, stages },
    actor
  );
  if (!result.success) return res.status(400).json(result);
  return res.status(201).json(result);
}

export async function getDefinition(req, res) {
  const { definitionId } = req.params;
  const result = await workflowEngine.getWorkflowDefinition(definitionId);
  if (!result.success) return res.status(404).json(result);
  return res.json(result);
}

export async function listDefinitions(req, res) {
  const { entityType, isActive } = req.query;
  const result = await workflowEngine.listWorkflowDefinitions({
    entityType,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

// --------------------------------------------------------------------------
// Workflow Instances
// --------------------------------------------------------------------------

export async function startInstance(req, res) {
  const { definitionId, entityId, metadata } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.startWorkflow({ definitionId, entityId, metadata }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.status(201).json(result);
}

export async function getInstance(req, res) {
  const { instanceId } = req.params;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.getWorkflowInstance(instanceId, actor);
  if (!result.success) return res.status(404).json(result);
  return res.json(result);
}

export async function listInstances(req, res) {
  const { entityId, definitionId, status } = req.query;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.listWorkflowInstances(
    { entityId, definitionId, status },
    actor
  );
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function approveInstance(req, res) {
  const { instanceId } = req.params;
  const { comment } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.approveStage(instanceId, { comment }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function rejectInstance(req, res) {
  const { instanceId } = req.params;
  const { reason } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.rejectStage(instanceId, { reason }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function getInstanceHistory(req, res) {
  const { instanceId } = req.params;
  const result = await workflowEngine.getWorkflowHistory(instanceId);
  if (!result.success) return res.status(404).json(result);
  return res.json(result);
}

export async function getMyTasks(req, res) {
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.getMyPendingTasks(actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

// --------------------------------------------------------------------------
// Simplified Single-Stage Workflow Actions
// --------------------------------------------------------------------------

export async function submitInstance(req, res) {
  const { instanceId } = req.params;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.submitWorkflow(instanceId, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function sendForReview(req, res) {
  const { instanceId } = req.params;
  const { assignedUserId, assignedRole, comment } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.sendForReview(instanceId, { assignedUserId, assignedRole, comment }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function sendForApproval(req, res) {
  const { instanceId } = req.params;
  const { assignedUserId, assignedRole, comment } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.sendForApproval(instanceId, { assignedUserId, assignedRole, comment }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function approveInstanceSimplified(req, res) {
  const { instanceId } = req.params;
  const { comment } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.approveWorkflow(instanceId, { comment }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function rejectInstanceSimplified(req, res) {
  const { instanceId } = req.params;
  const { comment, reason } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.rejectWorkflow(instanceId, { comment, reason }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function reviseInstance(req, res) {
  const { instanceId } = req.params;
  const { comment } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  const result = await workflowEngine.reviseWorkflow(instanceId, { comment }, actor);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export async function cancelInstance(req, res) {
  const { instanceId } = req.params;
  const { comment } = req.body;
  const actor = { userId: req.user?.dbId, roles: req.user?.roles || [] };
  console.log('[cancelInstance] Request received:', { instanceId, comment, actor });
  const result = await workflowEngine.cancelWorkflow(instanceId, { comment }, actor);
  console.log('[cancelInstance] Result:', result);
  if (!result.success) return res.status(400).json(result);
  return res.json(result);
}

export default {
  createDefinition,
  getDefinition,
  listDefinitions,
  startInstance,
  getInstance,
  listInstances,
  approveInstance,
  rejectInstance,
  getInstanceHistory,
  getMyTasks,
  submitInstance,
  sendForReview,
  sendForApproval,
  approveInstanceSimplified,
  rejectInstanceSimplified,
  reviseInstance,
  cancelInstance,
};
