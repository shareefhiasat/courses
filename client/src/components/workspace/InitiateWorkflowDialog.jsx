import React, { useState, useCallback, useEffect } from 'react';
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
import { AlertCircle, FileText } from 'lucide-react';
import WorkflowPdfPreviewPanel from '@components/operations-board/WorkflowPdfPreviewPanel.jsx';
import { initiateAttendanceWorkflow, findExistingAttendanceWorkflow } from '@services/business/workflowInitiationService.js';

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
  knownExisting = null,
}) {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState(null);
  const [errorSeverity, setErrorSeverity] = useState('warning');
  const [success, setSuccess] = useState(false);
  const [existingWorkflow, setExistingWorkflow] = useState(null);
  const [precheckExisting, setPrecheckExisting] = useState(knownExisting);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const className = cls
    ? (lang === 'ar' ? cls.nameAr || cls.nameEn || cls.code : cls.nameEn || cls.nameAr || cls.code)
    : '';

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    setErrorSeverity('warning');
    setSuccess(false);
    setPhase('');
    setExistingWorkflow(null);
    setPrecheckExisting(knownExisting);
    if (knownExisting || !cls?.id || !selectedDate) return undefined;
    let cancelled = false;
    findExistingAttendanceWorkflow(cls.id, selectedDate).then((result) => {
      if (!cancelled && result.success) setPrecheckExisting(result.data);
    });
    return () => { cancelled = true; };
  }, [open, knownExisting, cls?.id, selectedDate]);

  const handleConfirm = useCallback(async () => {
    if (!cls?.id || !selectedDate) return;
    if (precheckExisting) {
      setErrorSeverity('warning');
      setError(t('initiate_workflow_in_progress') || 'A workflow already exists for this class and date.');
      setExistingWorkflow(precheckExisting);
      return;
    }
    setLoading(true);
    setError(null);
    setErrorSeverity('warning');
    setSuccess(false);
    setExistingWorkflow(null);
    setPhase(t('initiate_workflow_exporting') || 'Exporting…');
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
        setError(t('initiate_workflow_draft_exists') || 'A draft workflow already exists for this class and date.');
        setExistingWorkflow(result.existingDraft || null);
      } else if (result.code === 409) {
        setErrorSeverity('warning');
        setError(t('initiate_workflow_in_progress') || 'A workflow already exists for this class and date.');
        setExistingWorkflow(result.existingDraft || null);
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
  }, [cls, program, subject, selectedDate, lang, user, t, precheckExisting]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setError(null);
    setErrorSeverity('warning');
    setSuccess(false);
    setPhase('');
    setExistingWorkflow(null);
    setPdfPreviewOpen(false);
    onClose();
  }, [loading, onClose]);

  const goToExisting = useCallback((wf) => {
    handleClose();
    onGoToOperations?.(wf);
  }, [handleClose, onGoToOperations]);

  const activeExisting = existingWorkflow || precheckExisting;

  const handlePreviewPdf = useCallback(() => {
    if (!activeExisting?.fileId) return;
    setPdfPreviewOpen(true);
  }, [activeExisting?.fileId]);

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth data-testid="initiate-workflow-dialog">
      <DialogTitle>
        {t('initiate_workflow_title') || 'Initiate Workflow'}
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            {t('initiate_workflow_success') || 'Draft workflow created successfully.'}
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('initiate_workflow_description') || 'A PDF attendance report will be attached to a new draft workflow.'}
            </Typography>
            {(className || selectedDate) && (
              <Typography variant="body2">
                {className && <><strong>{t('initiate_workflow_class') || 'Class'}:</strong> {className}{' '}</>}
                {selectedDate && <><strong>{t('initiate_workflow_date') || 'Date'}:</strong> {selectedDate}</>}
              </Typography>
            )}
            {precheckExisting && !error && (
              <Alert
                severity="warning"
                icon={<AlertCircle size={20} />}
                data-testid="initiate-workflow-existing-hint"
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span>{t('initiate_workflow_existing_hint') || 'A workflow already exists for this class and date.'}</span>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => goToExisting(precheckExisting)}
                      data-testid="initiate-workflow-goto-existing-precheck"
                    >
                      {t('initiate_workflow_go_operations') || 'Go to Operations'}
                    </Button>
                    {precheckExisting.fileId && (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<FileText size={14} />}
                        onClick={handlePreviewPdf}
                        data-testid="initiate-workflow-preview-pdf"
                      >
                        {t('operations_board_preview_pdf') || 'Preview PDF'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Alert>
            )}
            {error && (
              <Alert severity={errorSeverity}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span>{error}</span>
                  {(existingWorkflow || precheckExisting) && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => goToExisting(existingWorkflow || precheckExisting)}
                      sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      data-testid="initiate-workflow-goto-existing"
                    >
                      {t('initiate_workflow_go_operations') || 'Go to Operations'}
                    </Button>
                  )}
                </Box>
              </Alert>
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
              onClick={() => goToExisting(existingWorkflow || null)}
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
              disabled={loading || !cls?.id || Boolean(precheckExisting)}
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
    <Dialog
      open={pdfPreviewOpen}
      onClose={() => setPdfPreviewOpen(false)}
      maxWidth="md"
      fullWidth
      data-testid="initiate-workflow-pdf-preview-dialog"
    >
      <DialogTitle>{t('operations_board_preview_pdf') || 'Preview PDF'}</DialogTitle>
      <DialogContent>
        <WorkflowPdfPreviewPanel
          fileId={activeExisting?.fileId}
          fileName={activeExisting?.fileName || activeExisting?.title}
          open={pdfPreviewOpen}
          onClose={() => setPdfPreviewOpen(false)}
          t={t}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setPdfPreviewOpen(false)}>
          {t('close') || 'Close'}
        </Button>
        {activeExisting && (
          <Button
            variant="contained"
            onClick={() => {
              setPdfPreviewOpen(false);
              goToExisting(activeExisting);
            }}
          >
            {t('initiate_workflow_go_operations') || 'Go to Operations'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
    </>
  );
}
