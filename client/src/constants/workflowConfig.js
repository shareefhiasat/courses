/**
 * Workflow taxonomy config: category, attendance subtype, and approval flow metadata.
 */

export const APPROVAL_FLOW_OPTIONS = [
  {
    value: 'HR_ONLY',
    steps: ['owner', 'hr'],
    labelKey: 'workflow.approvalFlow.HR_ONLY.label',
    descKey: 'workflow.approvalFlow.HR_ONLY.desc',
  },
  {
    value: 'ADMIN_ONLY',
    steps: ['owner', 'admin'],
    labelKey: 'workflow.approvalFlow.ADMIN_ONLY.label',
    descKey: 'workflow.approvalFlow.ADMIN_ONLY.desc',
  },
  {
    value: 'HR_THEN_ADMIN',
    steps: ['owner', 'hr', 'admin'],
    labelKey: 'workflow.approvalFlow.HR_THEN_ADMIN.label',
    descKey: 'workflow.approvalFlow.HR_THEN_ADMIN.desc',
  },
  {
    value: 'ADMIN_THEN_HR',
    steps: ['owner', 'admin', 'hr'],
    labelKey: 'workflow.approvalFlow.ADMIN_THEN_HR.label',
    descKey: 'workflow.approvalFlow.ADMIN_THEN_HR.desc',
  },
  {
    value: 'INSTRUCTOR_THEN_HR',
    steps: ['owner', 'hr'],
    labelKey: 'workflow.approvalFlow.INSTRUCTOR_THEN_HR.label',
    descKey: 'workflow.approvalFlow.INSTRUCTOR_THEN_HR.desc',
  },
];

export const WORKFLOW_CATEGORY_OPTIONS = [
  { value: 'GENERAL', labelKey: 'workflow.category.GENERAL', variant: 'slate' },
  { value: 'ATTENDANCE', labelKey: 'workflow.category.ATTENDANCE', variant: 'blue' },
  { value: 'PENALTY', labelKey: 'workflow.category.PENALTY', variant: 'red' },
  { value: 'BEHAVIOR', labelKey: 'workflow.category.BEHAVIOR', variant: 'amber' },
  { value: 'DISCONTINUATION', labelKey: 'workflow.category.DISCONTINUATION', variant: 'purple' },
];

export const ATTENDANCE_SUBTYPE_OPTIONS = [
  {
    value: 'DAILY',
    labelKey: 'workflow.attendanceSubtype.DAILY',
    defaultApprovalFlow: 'INSTRUCTOR_THEN_HR',
    requiresClassContext: true,
    requiresSingleDate: true,
    contextKey: 'workflow.dialog.dailyContextHelp',
  },
  {
    value: 'WEEKLY_SUMMARY',
    labelKey: 'workflow.attendanceSubtype.WEEKLY_SUMMARY',
    defaultApprovalFlow: 'HR_THEN_ADMIN',
    requiresClassContext: true,
    requiresDates: true,
    contextKey: 'workflow.dialog.weeklyContextHelp',
  },
  {
    value: 'EXCUSE',
    labelKey: 'workflow.attendanceSubtype.EXCUSE',
    defaultApprovalFlow: 'HR_ONLY',
    requiresAttendance: true,
    requiresDates: true,
    requiresClassContext: true,
    contextKey: 'workflow.dialog.excuseContextHelp',
  },
  {
    value: 'WARNING',
    labelKey: 'workflow.attendanceSubtype.WARNING',
    defaultApprovalFlow: 'HR_ONLY',
    requiresClassContext: true,
    contextKey: 'workflow.dialog.warningContextHelp',
  },
];

export const CATEGORY_DEFAULT_APPROVAL_FLOW = {
  GENERAL: null,
  ATTENDANCE: 'INSTRUCTOR_THEN_HR',
  PENALTY: 'HR_ONLY',
  BEHAVIOR: 'HR_ONLY',
  DISCONTINUATION: 'HR_THEN_ADMIN',
};

export const APPROVAL_FLOW_BY_VALUE = Object.fromEntries(
  APPROVAL_FLOW_OPTIONS.map((o) => [o.value, o])
);

export const CATEGORY_BY_VALUE = Object.fromEntries(
  WORKFLOW_CATEGORY_OPTIONS.map((o) => [o.value, o])
);

export const ATTENDANCE_SUBTYPE_BY_VALUE = Object.fromEntries(
  ATTENDANCE_SUBTYPE_OPTIONS.map((o) => [o.value, o])
);

/** @deprecated use APPROVAL_FLOW_OPTIONS */
export const WORKFLOW_TYPE_OPTIONS = APPROVAL_FLOW_OPTIONS.map((flow) => ({
  value: flow.value === 'HR_ONLY' ? 'GENERAL_HR'
    : flow.value === 'ADMIN_ONLY' ? 'GENERAL_ADMIN'
    : flow.value === 'HR_THEN_ADMIN' ? 'GENERAL_MIXED_HR_ADMIN'
    : flow.value === 'ADMIN_THEN_HR' ? 'GENERAL_MIXED_ADMIN_HR'
    : 'GENERAL_HR',
  steps: flow.steps,
  labelKey: flow.labelKey,
  descKey: flow.descKey,
}));

export const WORKFLOW_TYPE_BY_VALUE = Object.fromEntries(
  WORKFLOW_TYPE_OPTIONS.map((option) => [option.value, option])
);

export function resolveDefaultApprovalFlow(workflowCategory, attendanceSubtype) {
  if (workflowCategory === 'ATTENDANCE' && attendanceSubtype) {
    return ATTENDANCE_SUBTYPE_BY_VALUE[attendanceSubtype]?.defaultApprovalFlow
      || CATEGORY_DEFAULT_APPROVAL_FLOW.ATTENDANCE;
  }
  return CATEGORY_DEFAULT_APPROVAL_FLOW[workflowCategory] || 'HR_ONLY';
}

export function getWorkflowDisplayLabel(doc, t) {
  const category = doc.workflowCategory || 'GENERAL';
  const categoryLabel = t(`workflow.category.${category}`, category);

  if (category === 'ATTENDANCE' && doc.attendanceSubtype) {
    const subtypeLabel = t(`workflow.attendanceSubtype.${doc.attendanceSubtype}`, doc.attendanceSubtype);
    return `${categoryLabel} · ${subtypeLabel}`;
  }

  return categoryLabel;
}

export function getCategoryFilterChips(t) {
  return [
    { id: 'all', label: t('workflow.filters.allCategories', 'All categories'), variant: 'slate' },
    ...WORKFLOW_CATEGORY_OPTIONS.map((cat) => ({
      id: cat.value,
      label: t(cat.labelKey, cat.value),
      variant: cat.variant,
      filterKey: 'workflowCategory',
      filterValue: cat.value,
    })),
  ];
}
