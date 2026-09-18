import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { CheckCircle2, FileText, ExternalLink, Calendar, User } from '@utils/icons.jsx';

/**
 * Post-approval success dialog showing the generated weekly attendance violation report snapshot.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {object|null} props.snapshot - { fileId, filename, weekFrom, weekTo }
 * @param {function} props.t - translation function
 */
export default function ApprovalSuccessDialog({
  open,
  onClose,
  snapshot,
  t,
}) {
  const handleOpenReport = () => {
    if (snapshot?.fileId) {
      window.open(`/api/v1/drive/files/${snapshot.fileId}/download`, '_blank');
    }
  };

  // Format date to remove ISO timestamp
  const formatDate = (dateStr) => {
    if (!dateStr) return dateStr;
    // Handle ISO timestamps like "2026-07-05T00:00:00.000Z"
    return dateStr.split('T')[0];
  };

  const isDaily = !!snapshot?.date;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="approval-success-dialog"
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircle2 size={22} color="#16a34a" />
        {snapshot?.date && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#3b82f6' }}>
            <Calendar size={18} />
            <User size={18} />
          </Box>
        )}
        {t('workflow_approval_success_title', 'Workflow Approved Successfully')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
          <Alert severity="success" variant="filled">
            {snapshot?.date
              ? t('workflow_approval_success_body_daily', 'The workflow has been approved. A daily attendance report snapshot has been generated and attached as a back-reference.')
              : t('workflow_approval_success_body', 'The workflow has been approved. A weekly attendance violation report snapshot has been generated and attached as a back-reference.')}
          </Alert>

          {snapshot && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <FileText size={28} style={{ color: '#2563eb', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                  {snapshot.filename || 'attendance_official.pdf'}
                </Typography>
                {snapshot.date && (
                  <Typography variant="caption" color="text.secondary">
                    {t('date', 'Date')}: {formatDate(snapshot.date)}
                  </Typography>
                )}
                {snapshot.weekFrom && snapshot.weekTo && !isDaily && (
                  <Typography variant="caption" color="text.secondary">
                    {t('week_range', 'Week')}: {formatDate(snapshot.weekFrom)} → {formatDate(snapshot.weekTo)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} data-testid="approval-success-close">
          {t('close', 'Close')}
        </Button>
        {snapshot?.fileId && (
          <Button
            variant="contained"
            startIcon={<ExternalLink size={16} />}
            onClick={handleOpenReport}
            data-testid="approval-success-open-report"
          >
            {t('open_report', 'Open Report')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
