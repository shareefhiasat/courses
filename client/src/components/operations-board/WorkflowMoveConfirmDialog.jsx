import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { AlertTriangle, ArrowRight, Workflow as WorkflowIcon, ClipboardCheck } from 'lucide-react';
import { shortenWorkflowDisplayName } from './operationsBoardDisplayUtils.js';
import { resolveWorkflowNotifyMeta } from './workflowBoardRules.js';

/**
 * Confirmation dialog before a workflow board status move.
 */
export default function WorkflowMoveConfirmDialog({
  open,
  onClose,
  onConfirm,
  fromColumn,
  toColumn,
  columns = [],
  itemName,
  loading = false,
  adminOverride = false,
  roleContext = {},
  workflowType = '',
  attendanceSubtype = '',
  t,
  lang = 'en',
}) {
  const fromCol = columns.find((c) => c.id === fromColumn);
  const toCol = columns.find((c) => c.id === toColumn);
  const fromLabel = fromCol ? (t(fromCol.i18nKey) || fromCol.name) : fromColumn;
  const toLabel = toCol ? (t(toCol.i18nKey) || toCol.name) : toColumn;
  let displayName = shortenWorkflowDisplayName(itemName);
  if (lang === 'ar' && displayName && displayName.includes('Daily Attendance')) {
    displayName = displayName.replace(/Daily Attendance/g, t('operations_board_daily_attendance') || 'حضور يومي');
  }
  const meta = resolveWorkflowNotifyMeta(fromColumn, toColumn, roleContext);
  const isOverride = adminOverride || meta.adminOverride;

  const title = isOverride
    ? (t('operations_board_move_admin_override_title') || 'Not your role — proceed with caution')
    : (t(meta.titleKey) || t('operations_board_move_confirm_title') || 'Confirm status change');
  const body = isOverride
    ? (t('operations_board_move_admin_override_body') || 'Instructor action only. Continue only if they are unavailable. This is logged.')
    : (t(meta.bodyKey) || t('operations_board_move_confirm_body') || 'Move this workflow from {from} to {to}?')
      .replace('{from}', fromLabel)
      .replace('{to}', toLabel);

  let notifyText = null;
  if (isOverride) {
    notifyText = t('operations_board_move_admin_override_notify')
      || 'The instructor will be notified that an Admin acted on their behalf.';
  } else if (meta?.notifyKey === 'operations_board_move_notify_role' && meta.roleKey) {
    notifyText = (t(meta.notifyKey) || '').replace('{role}', t(meta.roleKey) || meta.roleKey);
  } else if (meta?.notifyKey) {
    notifyText = t(meta.notifyKey);
  }

  const lockWarningText = meta.lockWarning
    ? (t(meta.lockWarningKey) || t('operations_board_move_admin_lock_warning'))
    : null;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      data-testid="workflow-move-confirm-dialog"
    >
      <DialogTitle sx={isOverride ? { color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 } : undefined}>
        {isOverride && <AlertTriangle size={20} />}
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {isOverride && (
            <Alert severity="error" variant="filled" icon={<AlertTriangle size={18} />} data-testid="workflow-move-override-alert">
              {t('operations_board_move_admin_override_alert')
                || 'Admin exception — use only when the instructor cannot act.'}
            </Alert>
          )}
          {displayName && (
            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word', color: 'text.secondary' }}>
              {displayName}
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              px: 2,
              py: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
            data-testid="workflow-move-status-transition"
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, opacity: 0.7 }}>
              <WorkflowIcon size={18} style={{ color: fromCol?.color || '#9ca3af', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color: fromCol?.color || 'text.secondary' }}>
                {fromLabel}
              </Typography>
            </Box>
            <ArrowRight size={20} style={{ flexShrink: 0, opacity: 0.5 }} />
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <WorkflowIcon size={20} style={{ color: toCol?.color || '#6b7280', flexShrink: 0 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: toCol?.color || 'text.primary' }}>
                {toLabel}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{body}</Typography>
          {fromColumn === 'UNDER_HR_REVIEW' && toColumn === 'APPROVED' && (workflowType === 'ATTENDANCE_WEEKLY' || attendanceSubtype === 'WEEKLY_SUMMARY') && (
            <Alert
              severity="info"
              icon={<ClipboardCheck size={18} />}
              data-testid="workflow-move-snapshot-alert"
            >
              {t('workflow_snapshot_info_weekly', 'A weekly attendance violation report will be generated and attached as a back-reference to this workflow.')}
            </Alert>
          )}
          {fromColumn === 'UNDER_HR_REVIEW' && toColumn === 'APPROVED' && (workflowType === 'ATTENDANCE_DAILY' || attendanceSubtype === 'DAILY') && (
            <Alert
              severity="info"
              icon={<ClipboardCheck size={18} />}
              data-testid="workflow-move-snapshot-alert-daily"
            >
              {t('workflow_snapshot_info_daily', 'A daily attendance report snapshot will be generated and attached as a back-reference to this workflow.')}
            </Alert>
          )}
          {notifyText && (
            <Alert severity={isOverride ? 'warning' : 'info'} data-testid="workflow-move-notify-alert" sx={{ mt: 0.5 }}>
              {notifyText}
            </Alert>
          )}
          {lockWarningText && (
            <Alert severity="warning" data-testid="workflow-move-lock-alert" sx={{ mt: 0.5 }}>
              {lockWarningText}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} disabled={loading} data-testid="workflow-move-cancel">
          {t('operations_board_move_cancel') || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          color={isOverride ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
          data-testid="workflow-move-confirm"
        >
          {loading
            ? (t('operations_board_loading') || 'Loading…')
            : (isOverride
              ? (t('operations_board_move_admin_override_confirm') || 'Proceed')
              : (t('operations_board_move_confirm') || 'Confirm'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
