/**
 * Workflow taxonomy mapping utilities.
 * Bridges legacy workflowType with approvalFlow + workflowCategory + attendanceSubtype.
 */

const WORKFLOW_TYPE_TO_TAXONOMY = {
  ATTENDANCE_DAILY: {
    workflowCategory: 'ATTENDANCE',
    attendanceSubtype: 'DAILY',
    approvalFlow: 'INSTRUCTOR_THEN_HR',
  },
  ATTENDANCE_WEEKLY: {
    workflowCategory: 'ATTENDANCE',
    attendanceSubtype: 'WEEKLY_SUMMARY',
    approvalFlow: 'HR_THEN_ADMIN',
  },
  GENERAL_HR: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'HR_ONLY',
  },
  GENERAL_ADMIN: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'ADMIN_ONLY',
  },
  GENERAL_MIXED_HR_ADMIN: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'HR_THEN_ADMIN',
  },
  GENERAL_MIXED_ADMIN_HR: {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'ADMIN_THEN_HR',
  },
};

const APPROVAL_FLOW_TO_LEGACY_TYPE = {
  HR_ONLY: 'GENERAL_HR',
  ADMIN_ONLY: 'GENERAL_ADMIN',
  HR_THEN_ADMIN: 'GENERAL_MIXED_HR_ADMIN',
  ADMIN_THEN_HR: 'GENERAL_MIXED_ADMIN_HR',
  INSTRUCTOR_THEN_HR: 'GENERAL_HR',
};

const CATEGORY_DEFAULTS = {
  ATTENDANCE: {
    DAILY: { approvalFlow: 'INSTRUCTOR_THEN_HR', workflowType: 'ATTENDANCE_DAILY' },
    WEEKLY_SUMMARY: { approvalFlow: 'HR_THEN_ADMIN', workflowType: 'ATTENDANCE_WEEKLY' },
    EXCUSE: { approvalFlow: 'HR_ONLY', workflowType: 'GENERAL_HR' },
    WARNING: { approvalFlow: 'HR_ONLY', workflowType: 'GENERAL_HR' },
  },
  PENALTY: { approvalFlow: 'HR_ONLY', workflowType: 'GENERAL_HR' },
  BEHAVIOR: { approvalFlow: 'HR_ONLY', workflowType: 'GENERAL_HR' },
  DISCONTINUATION: { approvalFlow: 'HR_THEN_ADMIN', workflowType: 'GENERAL_MIXED_HR_ADMIN' },
  GENERAL: { approvalFlow: 'HR_ONLY', workflowType: 'GENERAL_HR' },
};

export function taxonomyFromWorkflowType(workflowType) {
  return WORKFLOW_TYPE_TO_TAXONOMY[workflowType] || {
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: 'HR_ONLY',
  };
}

export function resolveApprovalFlow(document) {
  if (document?.approvalFlow) return document.approvalFlow;
  if (document?.workflowType) {
    return taxonomyFromWorkflowType(document.workflowType).approvalFlow;
  }
  return 'HR_ONLY';
}

export function resolveWorkflowCategory(document) {
  if (document?.workflowCategory) return document.workflowCategory;
  if (document?.workflowType) {
    return taxonomyFromWorkflowType(document.workflowType).workflowCategory;
  }
  return 'GENERAL';
}

export function buildTaxonomyFields(input = {}) {
  const {
    workflowType: legacyType,
    workflowCategory,
    attendanceSubtype,
    approvalFlow,
  } = input;

  if (workflowCategory) {
    let resolvedFlow = approvalFlow;
    let resolvedLegacy = legacyType;

    if (!resolvedFlow) {
      if (workflowCategory === 'ATTENDANCE' && attendanceSubtype) {
        resolvedFlow = CATEGORY_DEFAULTS.ATTENDANCE[attendanceSubtype]?.approvalFlow || 'HR_ONLY';
        resolvedLegacy = CATEGORY_DEFAULTS.ATTENDANCE[attendanceSubtype]?.workflowType || 'GENERAL_HR';
      } else if (workflowCategory !== 'ATTENDANCE') {
        resolvedFlow = CATEGORY_DEFAULTS[workflowCategory]?.approvalFlow || 'HR_ONLY';
        resolvedLegacy = CATEGORY_DEFAULTS[workflowCategory]?.workflowType || 'GENERAL_HR';
      } else {
        resolvedFlow = 'HR_ONLY';
        resolvedLegacy = 'GENERAL_HR';
      }
    }

    if (!resolvedLegacy && resolvedFlow) {
      resolvedLegacy = APPROVAL_FLOW_TO_LEGACY_TYPE[resolvedFlow] || 'GENERAL_HR';
    }

    if (workflowCategory === 'ATTENDANCE' && attendanceSubtype === 'DAILY') {
      resolvedLegacy = 'ATTENDANCE_DAILY';
    } else if (workflowCategory === 'ATTENDANCE' && attendanceSubtype === 'WEEKLY_SUMMARY') {
      resolvedLegacy = 'ATTENDANCE_WEEKLY';
    }

    return {
      workflowCategory,
      attendanceSubtype: workflowCategory === 'ATTENDANCE' ? attendanceSubtype || null : null,
      approvalFlow: resolvedFlow || 'HR_ONLY',
      workflowType: resolvedLegacy || 'GENERAL_HR',
    };
  }

  if (legacyType) {
    const mapped = taxonomyFromWorkflowType(legacyType);
    return {
      workflowType: legacyType,
      workflowCategory: mapped.workflowCategory,
      attendanceSubtype: mapped.attendanceSubtype,
      approvalFlow: approvalFlow || mapped.approvalFlow,
    };
  }

  return {
    workflowType: 'GENERAL_HR',
    workflowCategory: 'GENERAL',
    attendanceSubtype: null,
    approvalFlow: approvalFlow || 'HR_ONLY',
  };
}

export function buildWorkflowDocumentFilters(filters = {}) {
  const where = {};
  const {
    workflowType,
    workflowCategory,
    attendanceSubtype,
    approvalFlow,
    status,
  } = filters;

  if (workflowType) where.workflowType = workflowType;
  if (workflowCategory) where.workflowCategory = workflowCategory;
  if (attendanceSubtype) where.attendanceSubtype = attendanceSubtype;
  if (approvalFlow) where.approvalFlow = approvalFlow;
  if (status) where.status = status;

  return where;
}

export function isHrAccessibleWorkflow(document) {
  const category = resolveWorkflowCategory(document);
  const flow = resolveApprovalFlow(document);
  return (
    category === 'GENERAL' ||
    category === 'ATTENDANCE' ||
    category === 'PENALTY' ||
    category === 'BEHAVIOR' ||
    category === 'DISCONTINUATION' ||
    flow === 'HR_ONLY' ||
    flow === 'HR_THEN_ADMIN' ||
    flow === 'ADMIN_THEN_HR' ||
    flow === 'INSTRUCTOR_THEN_HR'
  );
}

export function isAdminAccessibleWorkflow(document) {
  const category = resolveWorkflowCategory(document);
  const subtype = document?.attendanceSubtype;
  const flow = resolveApprovalFlow(document);
  return (
    (category === 'ATTENDANCE' && subtype === 'WEEKLY_SUMMARY') ||
    flow === 'ADMIN_ONLY' ||
    flow === 'HR_THEN_ADMIN' ||
    flow === 'ADMIN_THEN_HR' ||
    category === 'DISCONTINUATION'
  );
}

export default {
  taxonomyFromWorkflowType,
  resolveApprovalFlow,
  resolveWorkflowCategory,
  buildTaxonomyFields,
  buildWorkflowDocumentFilters,
  isHrAccessibleWorkflow,
  isAdminAccessibleWorkflow,
};
