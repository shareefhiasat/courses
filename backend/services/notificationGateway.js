/**
 * Notification Gateway Service (Legacy)
 *
 * PURPOSE: Legacy notification gateway - DEPRECATED
 * 
 * This file is kept for backward compatibility with workflow notifications.
 * New code should use the new notification system in services/notifications/index.js
 * 
 * Migration: Replace calls to this gateway with the new notificationGateway from services/notifications/index.js
 */

import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';

// Legacy function mapping to new system
export async function notifyWorkflowAssigned(user, { workflowInstanceId, workflowName, stageName, entityType, entityId, userName }) {
  await notificationGateway.emit(
    EVENTS.WORKFLOW_ASSIGNED,
    { workflowInstanceId, workflowName, stageName, entityType, entityId, userName },
    { id: user?.id },
    { userId: user?.id }
  );
}

export async function notifyWorkflowApproved(initiator, { instanceId, workflowName, stageName, approverName }) {
  await notificationGateway.emit(
    EVENTS.WORKFLOW_APPROVED,
    { instanceId, workflowName, stageName, approverName },
    { id: initiator?.id },
    { userId: initiator?.id }
  );
}

export async function notifyWorkflowCompleted(initiator, { instanceId, workflowName }) {
  await notificationGateway.emit(
    EVENTS.WORKFLOW_COMPLETED,
    { instanceId, workflowName },
    { id: initiator?.id },
    { userId: initiator?.id }
  );
}

export async function notifyWorkflowRejected(initiator, { instanceId, workflowName, stageName, rejecterName, reason }) {
  await notificationGateway.emit(
    EVENTS.WORKFLOW_REJECTED,
    { instanceId, workflowName, stageName, rejecterName, reason },
    { id: initiator?.id },
    { userId: initiator?.id }
  );
}

export async function notifySLAWarning(user, { workflowInstanceId, workflowName, stageName, deadline }) {
  await notificationGateway.emit(
    EVENTS.WORKFLOW_SLA_WARNING,
    { workflowInstanceId, workflowName, stageName, deadline },
    { id: user?.id },
    { userId: user?.id }
  );
}

export async function notifySLAOverdue(user, { workflowInstanceId, workflowName, stageName, deadline }) {
  await notificationGateway.emit(
    EVENTS.WORKFLOW_SLA_OVERDUE,
    { workflowInstanceId, workflowName, stageName, deadline },
    { id: user?.id },
    { userId: user?.id }
  );
}

// Deprecated generic sender - kept for compatibility
async function sendNotification(notification) {
  console.warn('[notificationGateway] Legacy sendNotification called - use new notification system');
  // This is a no-op - notifications should be sent via the new system
}

export default {
  sendNotification,
  notifyWorkflowAssigned,
  notifyWorkflowApproved,
  notifyWorkflowCompleted,
  notifyWorkflowRejected,
  notifySLAWarning,
  notifySLAOverdue,
};
