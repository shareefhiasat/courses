/**
 * Document Workflows Controller
 *
 * PURPOSE: HTTP layer for attendance and manual-signature workflow transitions.
 */

import {
  submitAttendanceForReview,
  rejectAttendanceWithFeedback,
  approveAttendanceToHr,
  markAwaitingManualSignature,
  uploadSignedDocumentForHr,
  finalizeHrFiling
} from '../services/documentApprovalWorkflowService.js';

const badRequest = (res, message) => {
  return res.status(400).json({
    success: false,
    error: message
  });
};

const buildTransitionInput = (req) => {
  const { termId, classId } = req.body;

  return {
    document: req.body.document,
    actor: req.user || null,
    termId,
    classId
  };
};

export const submitAttendanceForReviewController = async (req, res) => {
  try {
    if (!req.body?.document?.id || !req.body?.document?.fileName) {
      return badRequest(res, 'document.id and document.fileName are required');
    }

    const result = await submitAttendanceForReview(buildTransitionInput(req));
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit attendance for review'
    });
  }
};

export const rejectAttendanceWithFeedbackController = async (req, res) => {
  try {
    if (!req.body?.document?.id || !req.body?.document?.fileName) {
      return badRequest(res, 'document.id and document.fileName are required');
    }

    const result = await rejectAttendanceWithFeedback({
      ...buildTransitionInput(req),
      feedback: req.body.feedback || ''
    });

    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject attendance with feedback'
    });
  }
};

export const approveAttendanceToHrController = async (req, res) => {
  try {
    if (!req.body?.document?.id || !req.body?.document?.fileName) {
      return badRequest(res, 'document.id and document.fileName are required');
    }

    const result = await approveAttendanceToHr(buildTransitionInput(req));
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve attendance to HR'
    });
  }
};

export const markAwaitingManualSignatureController = async (req, res) => {
  try {
    if (!req.body?.document?.id || !req.body?.document?.fileName) {
      return badRequest(res, 'document.id and document.fileName are required');
    }

    const result = await markAwaitingManualSignature(buildTransitionInput(req));
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to set awaiting manual signature state'
    });
  }
};

export const uploadSignedDocumentForHrController = async (req, res) => {
  try {
    if (!req.body?.document?.id || !req.body?.document?.fileName) {
      return badRequest(res, 'document.id and document.fileName are required');
    }

    const result = await uploadSignedDocumentForHr(buildTransitionInput(req));
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit signed document for HR'
    });
  }
};

export const finalizeHrFilingController = async (req, res) => {
  try {
    if (!req.body?.document?.id || !req.body?.document?.fileName || !req.body?.document?.workflowState) {
      return badRequest(res, 'document.id, document.fileName, and document.workflowState are required');
    }

    const result = await finalizeHrFiling(buildTransitionInput(req));
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to finalize HR filing'
    });
  }
};
