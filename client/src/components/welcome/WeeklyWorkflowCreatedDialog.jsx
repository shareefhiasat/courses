import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  List,
  ListItem,
  Typography,
  Alert,
} from '@mui/material';
import { ExternalLink, FileText } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { toIsoDate } from '@components/operations-board/boardClassCalendarUtils.js';

function getLocalizedClassName(cls, lang) {
  if (!cls) return '';
  return lang === 'ar'
    ? cls.nameAr || cls.nameEn || cls.code || cls.id
    : cls.nameEn || cls.nameAr || cls.code || cls.id;
}

export default function WeeklyWorkflowCreatedDialog({
  open,
  onClose,
  results = [],
  errors = [],
  cohortClasses = [],
  selectedDate,
  programId,
  termId,
  onOpenWeekBoard,
}) {
  const { t, lang } = useLang();

  const buildWorkflowUrl = (workflowId) => {
    const params = new URLSearchParams({
      programId: String(programId || ''),
      tab: 'operations',
      lane: 'status',
      viewMode: 'week',
      date: toIsoDate(selectedDate) || '',
      workflowId: String(workflowId || ''),
    });
    if (termId) {
      params.set('termId', String(termId));
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${pathname}?${params.toString()}`;
  };

  const items = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      const cls = cohortClasses.find((c) => String(c.id) === String(r.classId));
      map.set(String(r.classId), {
        classId: r.classId,
        className: getLocalizedClassName(cls, lang),
        workflowId: r.data?.id,
        blobUrl: r.data?.blobUrl || null,
        title: r.data?.title || t('weekly_workflow', 'Weekly workflow'),
        success: true,
        error: null,
      });
    });
    errors.forEach((e) => {
      const cls = cohortClasses.find((c) => String(c.id) === String(e.classId));
      const key = String(e.classId);
      const existingWorkflowId = e.existingDraft?.id || e.existingApproved?.id || e.existingDocument?.id || null;
      const errorText = e.error || e.message || t('workflow_initiation_error', 'Failed');
      if (map.has(key)) {
        const existing = map.get(key);
        existing.success = false;
        existing.existingWorkflowId = existingWorkflowId;
        existing.error = errorText;
      } else {
        map.set(key, {
          classId: e.classId,
          className: getLocalizedClassName(cls, lang),
          workflowId: null,
          existingWorkflowId,
          title: '',
          success: false,
          error: errorText,
        });
      }
    });
    return Array.from(map.values());
  }, [results, errors, cohortClasses, t, lang]);

  const handleOpen = (url) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('weekly_workflows_created_title', 'Weekly workflows created')}
      </DialogTitle>
      <DialogContent>
        {results.length === 0 && errors.length > 0 ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('weekly_workflows_all_failed', 'No workflows could be created.')}
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('weekly_workflows_created_summary', { count: results.length })}
          </Alert>
        )}
        {items.some((i) => !i.success && i.existingWorkflowId) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('weekly_workflows_already_exist_warning', 'Some classes already have a weekly workflow for this week. Open them below.')}
          </Alert>
        )}
        <List dense sx={{ pt: 0 }}>
          {items.map((item) => (
            <ListItem
              key={String(item.classId)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap variant="body1" fontWeight={500}>
                  {item.className}
                </Typography>
                {!item.success && !item.existingWorkflowId && (
                  <Typography color="error" variant="caption" display="block">
                    {item.error}
                  </Typography>
                )}
                {!item.success && item.existingWorkflowId && (
                  <Typography color="warning.main" variant="caption" display="block">
                    {item.error || t('weekly_workflow_already_exists', 'Already exists')}
                  </Typography>
                )}
              </Box>
              {item.success && item.blobUrl && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileText size={16} />}
                  onClick={() => handleOpen(item.blobUrl)}
                >
                  {t('open_draft_pdf', 'Draft')}
                </Button>
              )}
              {item.success && item.workflowId && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ExternalLink size={16} />}
                  onClick={() => handleOpen(buildWorkflowUrl(item.workflowId))}
                >
                  {t('open_in_new_tab', 'Open')}
                </Button>
              )}
              {!item.success && item.existingWorkflowId && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<ExternalLink size={16} />}
                  onClick={() => handleOpen(buildWorkflowUrl(item.existingWorkflowId))}
                >
                  {t('open_existing_workflow', 'Open existing')}
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={onOpenWeekBoard} variant="outlined" color="primary">
          {t('open_week_board', 'Open week board')}
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          {t('close', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
