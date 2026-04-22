/**
 * Notification Gateway Service
 *
 * PURPOSE: Centralized notification dispatch for the application
 * ARCHITECTURE: Business Logic → Notification Gateway → Email/Push/In-App
 */

// const { info, error, warn, debug } = require('../utils/logger.js');

/**
 * Generic notification sender
 * @param {object} notification - Notification object with type, recipient, message
 */
async function sendNotification(notification) {
  console.log('[notificationGateway] Sending notification:', notification);
  // TODO: Implement actual notification sending logic (email, push, in-app)
}

/**
 * Workflow notifications
 */
export async function notifyWorkflowAssigned(user, { workflowInstanceId, workflowName, stageName, entityType, entityId, userName }) {
  await sendNotification({
    type: 'workflow_assigned',
    recipient: user,
    data: { workflowInstanceId, workflowName, stageName, entityType, entityId, userName },
  });
}

export async function notifyWorkflowApproved(initiator, { instanceId, workflowName, stageName, approverName }) {
  await sendNotification({
    type: 'workflow_approved',
    recipient: initiator,
    data: { instanceId, workflowName, stageName, approverName },
  });
}

export async function notifyWorkflowCompleted(initiator, { instanceId, workflowName }) {
  await sendNotification({
    type: 'workflow_completed',
    recipient: initiator,
    data: { instanceId, workflowName },
  });
}

export async function notifyWorkflowRejected(initiator, { instanceId, workflowName, stageName, rejecterName, reason }) {
  await sendNotification({
    type: 'workflow_rejected',
    recipient: initiator,
    data: { instanceId, workflowName, stageName, rejecterName, reason },
  });
}

/**
 * SLA notifications
 */
export async function notifySLAWarning(user, { workflowInstanceId, workflowName, stageName, deadline }) {
  await sendNotification({
    type: 'sla_warning',
    recipient: user,
    data: { workflowInstanceId, workflowName, stageName, deadline },
  });
}

export async function notifySLAOverdue(user, { workflowInstanceId, workflowName, stageName, deadline }) {
  await sendNotification({
    type: 'sla_overdue',
    recipient: user,
    data: { workflowInstanceId, workflowName, stageName, deadline },
  });
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
