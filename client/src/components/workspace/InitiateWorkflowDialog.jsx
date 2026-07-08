import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { initiateAttendanceWorkflow } from '@services/business/workflowInitiationService.js';

export default function InitiateWorkflowDialog({
  open,
  onClose,
  cls,
  program,
  subject,
  selectedDate,
  lang,
  t,
  user,
  onGoToOperations,
}) {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState(null);
  const [errorSeverity, setErrorSeverity] = useState('warning');
  const [success, setSuccess] = useState(false);

  const className = cls
    ? (lang === 'ar' ? cls.nameAr || cls.nameEn || cls.code : cls.nameEn || cls.nameAr || cls.code)
    : '';

  const handleConfirm = useCallback(async () => {
    if (!cls?.id || !selectedDate) return;
    setLoading(true);
    setError(null);
    setErrorSeverity('warning');
    setSuccess(false);
    setPhase(t('initiate_workflow_exporting') || 'Exporting PDF report…');
    try {
      const result = await initiateAttendanceWorkflow({
        cls,
        program,
        subject,
        date: selectedDate,
        lang,
        user,
      });
      if (result.success) {
        setSuccess(true);
        setPhase('');
      } else if (result.code === 409 && result.existingDraft) {
        setErrorSeverity('warning');
        setError(t('initiate_workflow_draft_exists') || 'A draft workflow already exists for this class and date. Reject it first to create a new one.');
      } else if (result.code === 409) {
        setErrorSeverity('error');
        setError(t('initiate_workflow_in_progress') || 'An in-progress workflow already exists for this class and date. You cannot create a new one until it is completed or rejected.');
      } else {
        setErrorSeverity('error');
        setError(result.error || (t('initiate_workflow_failed') || 'Failed to create workflow. Please try again.'));
      }
    } catch (err) {
      console.error('[InitiateWorkflowDialog] error:', err);
      setError(err.message || (t('initiate_workflow_failed') || 'Failed to create workflow. Please try again.'));
      setErrorSeverity('error');
    } finally {
      setLoading(false);
    }
  }, [cls, program, subject, selectedDate, lang, user, t]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setError(null);
    setErrorSeverity('warning');
    setSuccess(false);
    setPhase('');
    onClose();
  }, [loading, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('initiate_workflow_title') || 'Initiate Attendance Workflow'}
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            {t('initiate_workflow_success') || 'Draft workflow created successfully with PDF attached.'}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('initiate_workflow_description') || 'A PDF daily attendance report will be exported and attached to a new draft workflow for this class and date.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('initiate_workflow_class') || 'Class'}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {className || '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('initiate_workflow_date') || 'Date'}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {selectedDate || '—'}
                </Typography>
              </Box>
            </Box>
            {error && (
              <Alert severity={errorSeverity}>{error}</Alert>
            )}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">{phase}</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {success ? (
          <>
            <Button onClick={handleClose} size="small">
              {t('close') || 'Close'}
            </Button>
            <Button
              onClick={() => {
                handleClose();
                onGoToOperations?.();
              }}
              variant="contained"
              size="small"
              data-testid="initiate-workflow-go-operations"
            >
              {t('initiate_workflow_go_operations') || 'Go to Operations'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading} size="small">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !cls?.id}
              variant="contained"
              size="small"
              data-testid="initiate-workflow-confirm"
            >
              {t('initiate_workflow_confirm') || 'Confirm'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
