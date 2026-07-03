/**
 * Re-export permission dependency rules from canonical client module.
 */
export {
  getPrerequisitesFor,
  expandWithDependencies,
  hasPermissionWithDeps,
  getScreenFromOperationKey,
  getOpSuffix,
  QR_VIEW_OPS,
  DASHBOARD_TAB_SCREEN_IDS,
  SUPER_ADMIN_ONLY_OPERATION_KEYS,
  PERMISSION_PREREQUISITES,
} from '../../client/src/constants/permissionDependencies.js';
