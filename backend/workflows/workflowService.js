import { getNextState, isValidTransition, getValidEvents } from './workflowStateMachines.js';

/**
 * Workflow Service
 * 
 * Provides high-level workflow operations using XState machines
 * Ensures all state transitions are valid and predictable
 */

/**
 * Approve a workflow document
 * Returns the next status or throws an error if transition is invalid
 */
export const approveWorkflow = (workflowType, currentStatus) => {
  const nextStatus = getNextState(workflowType, currentStatus, 'APPROVE');
  
  if (!nextStatus) {
    throw new Error(`Cannot approve workflow from status ${currentStatus} for workflow type ${workflowType}`);
  }
  
  return nextStatus;
};

/**
 * Reject a workflow document
 * Returns the next status or throws an error if transition is invalid
 */
export const rejectWorkflow = (workflowType, currentStatus) => {
  const nextStatus = getNextState(workflowType, currentStatus, 'REJECT');
  
  if (!nextStatus) {
    throw new Error(`Cannot reject workflow from status ${currentStatus} for workflow type ${workflowType}`);
  }
  
  return nextStatus;
};

/**
 * Return a workflow document to previous stage
 * Returns the next status or throws an error if transition is invalid
 */
export const returnWorkflow = (workflowType, currentStatus) => {
  const nextStatus = getNextState(workflowType, currentStatus, 'RETURN');
  
  if (!nextStatus) {
    throw new Error(`Cannot return workflow from status ${currentStatus} for workflow type ${workflowType}`);
  }
  
  return nextStatus;
};

/**
 * Submit a workflow document
 * Returns the next status or throws an error if transition is invalid
 */
export const submitWorkflow = (workflowType, currentStatus) => {
  const nextStatus = getNextState(workflowType, currentStatus, 'SUBMIT');
  
  if (!nextStatus) {
    throw new Error(`Cannot submit workflow from status ${currentStatus} for workflow type ${workflowType}`);
  }
  
  return nextStatus;
};

/**
 * Resubmit a rejected workflow document
 * Returns the next status or throws an error if transition is invalid
 */
export const resubmitWorkflow = (workflowType, currentStatus) => {
  const nextStatus = getNextState(workflowType, currentStatus, 'RESUBMIT');
  
  if (!nextStatus) {
    throw new Error(`Cannot resubmit workflow from status ${currentStatus} for workflow type ${workflowType}`);
  }
  
  return nextStatus;
};

/**
 * Validate if a workflow action is allowed
 */
export const canPerformAction = (workflowType, currentStatus, action) => {
  return isValidTransition(workflowType, currentStatus, action);
};

/**
 * Get all available actions for the current workflow state
 */
export const getAvailableActions = (workflowType, currentStatus) => {
  return getValidEvents(workflowType, currentStatus);
};

/**
 * Check if workflow is in a final state (approved or rejected)
 */
export const isWorkflowComplete = (currentStatus) => {
  return currentStatus === 'APPROVED' || currentStatus === 'REJECTED';
};

/**
 * Get human-readable action name
 */
export const getActionLabel = (action) => {
  const labels = {
    APPROVE: 'Approve',
    REJECT: 'Reject',
    RETURN: 'Return',
    SUBMIT: 'Submit',
    RESUBMIT: 'Resubmit'
  };
  
  return labels[action] || action;
};
