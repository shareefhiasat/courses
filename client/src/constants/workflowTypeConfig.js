/**
 * Workflow type metadata for UI labels and approval-flow previews.
 * Backend enum values (GENERAL_HR, etc.) are unchanged.
 */
export const WORKFLOW_TYPE_OPTIONS = [
  {
    value: 'GENERAL_HR',
    steps: ['owner', 'hr'],
    labelKey: 'workflow.types.GENERAL_HR.label',
    descKey: 'workflow.types.GENERAL_HR.desc',
  },
  {
    value: 'GENERAL_ADMIN',
    steps: ['owner', 'admin'],
    labelKey: 'workflow.types.GENERAL_ADMIN.label',
    descKey: 'workflow.types.GENERAL_ADMIN.desc',
  },
  {
    value: 'GENERAL_MIXED_HR_ADMIN',
    steps: ['owner', 'hr', 'admin'],
    labelKey: 'workflow.types.GENERAL_MIXED_HR_ADMIN.label',
    descKey: 'workflow.types.GENERAL_MIXED_HR_ADMIN.desc',
  },
  {
    value: 'GENERAL_MIXED_ADMIN_HR',
    steps: ['owner', 'admin', 'hr'],
    labelKey: 'workflow.types.GENERAL_MIXED_ADMIN_HR.label',
    descKey: 'workflow.types.GENERAL_MIXED_ADMIN_HR.desc',
  },
];

export const WORKFLOW_TYPE_BY_VALUE = Object.fromEntries(
  WORKFLOW_TYPE_OPTIONS.map((option) => [option.value, option])
);
