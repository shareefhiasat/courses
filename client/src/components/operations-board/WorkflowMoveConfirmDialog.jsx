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
import { resolveWorkflowNotifyMeta } from './workflowBoardRules.js';

/**
 * Confirmation dialog before a workflow board status move.
 * Reuses the InitiateWorkflowDialog look-and-feel.
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
  t,
}) {
  const fromCol = columns.find((c) => c.id === fromColumn);
  const toCol = columns.find((c) => c.id === toColumn);
  const fromLabel = fromCol ? (t(fromCol.i18nKey) || fromCol.name) : fromColumn;
  const toLabel = toCol ? (t(toCol.i18nKey) || toCol.name) : toColumn;
  const meta = resolveWorkflowNotifyMeta(fromColumn, toColumn);

  let notifyText = null;
  if (meta?.notifyKey === 'operations_board_move_notify_role' && meta.roleKey) {
    notifyText = (t(meta.notifyKey) || '').replace('{role}', t(meta.roleKey) || meta.roleKey);
  } else if (meta?.notifyKey) {
    notifyText = t(meta.notifyKey);
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth data-testid="workflow-move-confirm-dialog">
      <DialogTitle>
        {t('operations_board_move_confirm_title') || 'Confirm status change'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {itemName && (
            <Typography variant="body2" color="text.secondary">
              {itemName}
            </Typography>
          )}
          <Typography variant="body2">
            {(t('operations_board_move_confirm_body') || 'Move this workflow from {from} to {to}?')
              .replace('{from}', fromLabel)
              .replace('{to}', toLabel)}
          </Typography>
          {notifyText && (
            <Alert severity="info" data-testid="workflow-move-notify-alert">
              {notifyText}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} data-testid="workflow-move-cancel">
          {t('operations_board_move_cancel') || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          data-testid="workflow-move-confirm"
        >
          {loading
            ? (t('operations_board_loading') || 'Loading…')
            : (t('operations_board_move_confirm') || 'Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
