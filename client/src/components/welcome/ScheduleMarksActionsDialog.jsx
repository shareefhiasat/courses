import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { FileText, GraduationCap, Table, X, FileCheck2 } from 'lucide-react';
import {
  exportClassMarksReport,
  initiateMarksCertificateWorkflow,
  initiateMarksSheetWorkflow,
} from '@services/business/marksWorkflowService.jsx';

const ACTION_ITEMS = (t) => [
  {
    id: 'class-report',
    icon: FileText,
    title: t('marks.class_report') || 'Class Marks Report',
    subtitle: t('marks.class_report_subtitle') || 'Export subject marks for the selected class without workflow',
    workflow: false,
    color: '#14b8a6',
  },
  {
    id: 'certificate',
    icon: GraduationCap,
    title: t('marks.semester_certificate') || 'Semester Certificate',
    subtitle: t('marks.semester_certificate_subtitle') || 'Initiate approval workflow for the program-level certificate',
    workflow: true,
    color: '#8b5cf6',
  },
  {
    id: 'marks-sheet',
    icon: Table,
    title: t('marks.marks_sheet') || 'Subject Marks Sheet',
    subtitle: t('marks.marks_sheet_subtitle') || 'Initiate approval workflow for the class subject marks sheet',
    workflow: true,
    color: '#2563eb',
  },
];

export default function ScheduleMarksActionsDialog({
  open,
  onClose,
  program,
  academicTerm,
  cls,
  subject,
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);

  const canRun = useMemo(() => {
    const missingProgram = !program?.id;
    const missingTerm = !academicTerm;
    const missingClass = !cls?.id;
    return { missingProgram, missingTerm, missingClass };
  }, [program, academicTerm, cls]);

  const handleClassReport = useCallback(async () => {
    if (!cls?.id) return;
    setLoading('class-report');
    setResult(null);
    try {
      await exportClassMarksReport({ cls, program, subject, academicTerm, lang, user });
      setResult({ success: true, message: t('marks.class_report_exported') || 'Class marks report exported' });
    } catch (err) {
      setResult({ success: false, message: err.message || t('marks.export_failed') || 'Export failed' });
    } finally {
      setLoading(null);
    }
  }, [cls, program, subject, academicTerm, lang, user, t]);

  const handleCertificate = useCallback(async () => {
    if (!program?.id || !academicTerm) return;
    setLoading('certificate');
    setResult(null);
    try {
      const res = await initiateMarksCertificateWorkflow({ program, academicTerm, lang, user });
      if (res.success) {
        setResult({ success: true, message: t('marks.certificate_workflow_initiated') || 'Semester certificate workflow initiated' });
      } else {
        setResult({ success: false, message: res.error || t('marks.workflow_failed') || 'Workflow initiation failed' });
      }
    } catch (err) {
      setResult({ success: false, message: err.message || t('marks.workflow_failed') || 'Workflow initiation failed' });
    } finally {
      setLoading(null);
    }
  }, [program, academicTerm, lang, user, t]);

  const handleMarksSheet = useCallback(async () => {
    if (!cls?.id) return;
    setLoading('marks-sheet');
    setResult(null);
    try {
      const res = await initiateMarksSheetWorkflow({ cls, program, subject, academicTerm, lang, user });
      if (res.success) {
        setResult({ success: true, message: t('marks.sheet_workflow_initiated') || 'Marks sheet workflow initiated' });
      } else {
        setResult({ success: false, message: res.error || t('marks.workflow_failed') || 'Workflow initiation failed' });
      }
    } catch (err) {
      setResult({ success: false, message: err.message || t('marks.workflow_failed') || 'Workflow initiation failed' });
    } finally {
      setLoading(null);
    }
  }, [cls, program, subject, academicTerm, lang, user, t]);

  const handlers = {
    'class-report': handleClassReport,
    certificate: handleCertificate,
    'marks-sheet': handleMarksSheet,
  };

  const actions = ACTION_ITEMS(t);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileCheck2 size={20} color="#3b82f6" />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {t('marks.schedule_actions') || 'Marks Reports & Workflows'}
          </Typography>
        </Box>
        <IconButtonClose onClick={loading ? undefined : onClose} />
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {canRun.missingProgram && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('marks.select_program_first') || 'Select a program first'}
          </Alert>
        )}
        {canRun.missingTerm && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('marks.select_term_first') || 'Select an academic term first'}
          </Alert>
        )}
        {canRun.missingClass && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('marks.select_class_for_class_actions') || 'Select a class session to enable class-level reports'}
          </Alert>
        )}

        {result && (
          <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {result.message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {actions.map((action) => {
            const disabled =
              Boolean(loading) ||
              canRun.missingProgram ||
              canRun.missingTerm ||
              (action.id !== 'certificate' && canRun.missingClass);
            const Icon = action.icon;
            const isLoading = loading === action.id;

            return (
              <Button
                key={action.id}
                variant="outlined"
                fullWidth
                disabled={disabled}
                onClick={handlers[action.id]}
                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <Icon size={18} color={action.color} />}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 1.5,
                  px: 2,
                  borderColor: action.color,
                  color: action.color,
                  '&:hover': { borderColor: action.color, bgcolor: `${action.color}10` },
                  '&.Mui-disabled': { borderColor: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.26)' },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 1 }}>
                  <Typography variant="button" sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem', lineHeight: 1.2 }}>
                    {action.subtitle}
                  </Typography>
                </Box>
              </Button>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} disabled={Boolean(loading)} variant="outlined" size="small">
          {t('close') || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function IconButtonClose({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        padding: 6,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: onClick ? 1 : 0.3,
      }}
    >
      <X size={18} />
    </button>
  );
}
