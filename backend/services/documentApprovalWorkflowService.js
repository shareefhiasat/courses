/**
 * Document Approval Workflow Service
 *
 * PURPOSE:
 * Keep approval state machine in LMS backend while invoking MinIO actions.
 * This service is intentionally persistence-agnostic and should be wired to DB services.
 */

import * as fileService from './fileService.js';

const WORKFLOW_STATES = {
  DRAFT: 'draft',
  ADMIN_REVIEW: 'admin_review',
  REJECTED_BY_ADMIN: 'rejected_by_admin',
  APPROVED_BY_ADMIN: 'approved_by_admin',
  HR_FILED: 'hr_filed',
  AWAITING_SIGNATURE: 'awaiting_signature',
  SIGNED_UPLOADED: 'signed_uploaded'
};

const ALLOWED_TRANSITIONS = {
  [WORKFLOW_STATES.DRAFT]: [WORKFLOW_STATES.ADMIN_REVIEW],
  [WORKFLOW_STATES.ADMIN_REVIEW]: [WORKFLOW_STATES.REJECTED_BY_ADMIN, WORKFLOW_STATES.APPROVED_BY_ADMIN],
  [WORKFLOW_STATES.REJECTED_BY_ADMIN]: [WORKFLOW_STATES.ADMIN_REVIEW],
  [WORKFLOW_STATES.APPROVED_BY_ADMIN]: [WORKFLOW_STATES.AWAITING_SIGNATURE, WORKFLOW_STATES.HR_FILED],
  [WORKFLOW_STATES.AWAITING_SIGNATURE]: [WORKFLOW_STATES.SIGNED_UPLOADED],
  [WORKFLOW_STATES.SIGNED_UPLOADED]: [WORKFLOW_STATES.HR_FILED],
  [WORKFLOW_STATES.HR_FILED]: []
};

const resultOk = (payload, meta = {}) => ({
  success: true,
  payload,
  timestamp: Date.now(),
  ...meta
});

const resultErr = (code, message, meta = {}) => ({
  success: false,
  error: { code, message },
  timestamp: Date.now(),
  ...meta
});

const canTransition = (fromState, toState) => {
  const allowed = ALLOWED_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
};

const mapStateToFolder = ({ termId, classId, workflowState }) => {
  return `/Workflow/${termId}/${classId}/${workflowState}`;
};

const transitionDocument = async ({
  document,
  fromState,
  toState,
  actor,
  reason = '',
  termId,
  classId
}) => {
  try {
    if (!canTransition(fromState, toState)) {
      return resultErr('WORKFLOW_INVALID_TRANSITION', `Transition ${fromState} -> ${toState} is not allowed`, {
        payload: { documentId: document?.id, fromState, toState }
      });
    }

    const destinationFolder = mapStateToFolder({ termId, classId, workflowState: toState });

    // Update file metadata with new workflow status
    const updateResult = await fileService.updateFile(document.id, {
      folderPath: destinationFolder,
      workflowStatus: toState.toUpperCase()
    });

    if (!updateResult.success) {
      return updateResult;
    }

    // Add comment about the transition
    await fileService.addComment(document.id, `Workflow transition ${fromState} -> ${toState} by ${actor?.id || 'system'}. ${reason}`);

    return resultOk({
      documentId: document.id,
      fromState,
      toState,
      actorId: actor?.id || null,
      reason,
      minio: {
        destinationFolder
      }
    });
  } catch (error) {
    return resultErr('WORKFLOW_TRANSITION_FAILED', error.message, {
      payload: {
        documentId: document?.id,
        fromState,
        toState,
        actorId: actor?.id || null
      }
    });
  }
};

const submitAttendanceForReview = async ({ document, actor, termId, classId }) => {
  return transitionDocument({
    document,
    fromState: WORKFLOW_STATES.DRAFT,
    toState: WORKFLOW_STATES.ADMIN_REVIEW,
    actor,
    termId,
    classId
  });
};

const rejectAttendanceWithFeedback = async ({ document, actor, feedback, termId, classId }) => {
  return transitionDocument({
    document,
    fromState: WORKFLOW_STATES.ADMIN_REVIEW,
    toState: WORKFLOW_STATES.REJECTED_BY_ADMIN,
    actor,
    reason: feedback,
    termId,
    classId
  });
};

const approveAttendanceToHr = async ({ document, actor, termId, classId }) => {
  return transitionDocument({
    document,
    fromState: WORKFLOW_STATES.ADMIN_REVIEW,
    toState: WORKFLOW_STATES.APPROVED_BY_ADMIN,
    actor,
    termId,
    classId
  });
};

const markAwaitingManualSignature = async ({ document, actor, termId, classId }) => {
  return transitionDocument({
    document,
    fromState: WORKFLOW_STATES.APPROVED_BY_ADMIN,
    toState: WORKFLOW_STATES.AWAITING_SIGNATURE,
    actor,
    termId,
    classId
  });
};

const uploadSignedDocumentForHr = async ({ document, actor, termId, classId }) => {
  return transitionDocument({
    document,
    fromState: WORKFLOW_STATES.AWAITING_SIGNATURE,
    toState: WORKFLOW_STATES.SIGNED_UPLOADED,
    actor,
    termId,
    classId
  });
};

const finalizeHrFiling = async ({ document, actor, termId, classId }) => {
  const fromState = document.workflowState === WORKFLOW_STATES.SIGNED_UPLOADED
    ? WORKFLOW_STATES.SIGNED_UPLOADED
    : WORKFLOW_STATES.APPROVED_BY_ADMIN;

  return transitionDocument({
    document,
    fromState,
    toState: WORKFLOW_STATES.HR_FILED,
    actor,
    termId,
    classId
  });
};

export {
  WORKFLOW_STATES,
  ALLOWED_TRANSITIONS,
  canTransition,
  transitionDocument,
  submitAttendanceForReview,
  rejectAttendanceWithFeedback,
  approveAttendanceToHr,
  markAwaitingManualSignature,
  uploadSignedDocumentForHr,
  finalizeHrFiling
};

export default {
  WORKFLOW_STATES,
  ALLOWED_TRANSITIONS,
  canTransition,
  transitionDocument,
  submitAttendanceForReview,
  rejectAttendanceWithFeedback,
  approveAttendanceToHr,
  markAwaitingManualSignature,
  uploadSignedDocumentForHr,
  finalizeHrFiling
};
